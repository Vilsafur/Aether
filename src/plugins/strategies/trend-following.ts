import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Interval } from '../../contracts/Exchange.js'
import type { Notifier } from '../../contracts/Notifier.js'
import type { Store } from '../../contracts/Store.js'
import type { Strategy, StrategyContext, StrategyDecision } from '../../contracts/Strategy.js'
import type { AppContext } from '../../core/AppContext.js'
import type { Pair } from '../../core/Pair.js'

class TrendFollowingStrategy implements Strategy {
  private readonly store: Store
  private readonly notifier: Notifier

  constructor(private readonly app: AppContext) {
    this.store = this.app.stores.get(this.app.config.get('plugin.store'))
    this.notifier = this.app.notifiers.get(this.app.config.get('plugin.notifier'))
  }

  async analyze(context: StrategyContext): Promise<StrategyDecision> {
    this.notifier.send(`Analyse Trend Following démarrée pour ${context.pair}`)

    const dailyScore = await this.getDailyTrendScore(context)
    const h4Score = await this.getH4ConfirmationScore(context)
    const h1Score = await this.getH1ExecutionScore(context)

    const totalScore = dailyScore + h4Score + h1Score

    const action: 'buy' | 'sell' = totalScore >= 5 ? 'buy' : 'sell'
    const confidence = parseFloat(
      (action === 'buy' ? totalScore / 7 : 1 - totalScore / 7).toFixed(2),
    )

    this.notifier.send(
      [
        `Décision stratégie`,
        `pair=${context.pair}`,
        `score=${totalScore}/7`,
        `daily=${dailyScore}/4`,
        `h4=${h4Score}/2`,
        `h1=${h1Score}/1`,
        `action=${action}`,
        `confidence=${confidence}`,
      ].join(' | '),
    )

    return {
      action,
      confidence,
      reason: [
        `Trend Following BTC/EUR`,
        `score=${totalScore}/7`,
        `daily=${dailyScore}/4`,
        `h4=${h4Score}/2`,
        `h1=${h1Score}/1`,
        `action=${action}`,
      ].join(' | '),
    }
  }

  private async getDailyTrendScore(context: StrategyContext): Promise<number> {
    this.notifier.send(`Analyse tendance principale 1D`)

    const candles = await this.getCandles(context.pair, '1d', 220)

    if (candles.length < 200) {
      this.notifier.send(`Pas assez de bougies 1D attendu : ${candles.length}/200`)
      return 0
    }

    let score = 0

    const last = this.last(candles)

    const avg200 = this.average(candles.slice(-200).map((c) => c.close))
    const avg50 = this.average(candles.slice(-50).map((c) => c.close))

    if (last.close > avg200) {
      score += 1
      this.notifier.send(`1D OK | prix au-dessus MA200 | close=${last.close} | ma200=${avg200}`)
    } else {
      this.notifier.send(`1D KO | prix sous MA200 | close=${last.close} | ma200=${avg200}`)
    }

    if (avg50 > avg200) {
      score += 1
      this.notifier.send(`1D OK | MA50 au-dessus MA200 | ma50=${avg50} | ma200=${avg200}`)
    } else {
      this.notifier.send(`1D KO | MA50 sous MA200 | ma50=${avg50} | ma200=${avg200}`)
    }

    const candle90DaysAgo = candles[candles.length - 90]
    if (candle90DaysAgo !== undefined && last.close > candle90DaysAgo.close) {
      score += 1
      this.notifier.send(
        `1D OK | prix supérieur à J-90 | close=${last.close} | j90=${candle90DaysAgo.close}`,
      )
    } else {
      this.notifier.send(`1D KO | prix inférieur ou égal à J-90`)
    }

    if (this.hasHigherLows(candles.slice(-60), 20)) {
      score += 1
      this.notifier.send(`1D OK | creux ascendants détectés`)
    } else {
      this.notifier.send(`1D KO | creux ascendants non confirmés`)
    }

    this.notifier.send(`Score 1D terminé : ${score}/4`)

    return score
  }

  private async getH4ConfirmationScore(context: StrategyContext): Promise<number> {
    this.notifier.send(`Analyse confirmation 4H`)

    const candles = await this.getCandles(context.pair, '4h', 120)

    if (candles.length < 50) {
      this.notifier.send(`Pas assez de bougies 4H attendu : ${candles.length}/50`)
      return 0
    }

    let score = 0

    const last = this.last(candles)

    const avg20 = this.average(candles.slice(-20).map((c) => c.close))
    const avg50 = this.average(candles.slice(-50).map((c) => c.close))

    if (last.close > avg50) {
      score += 1
      this.notifier.send(`4H OK | prix au-dessus MA50 | close=${last.close} | ma50=${avg50}`)
    } else {
      this.notifier.send(`4H KO | prix sous MA50 | close=${last.close} | ma50=${avg50}`)
    }

    if (avg20 > avg50) {
      score += 1
      this.notifier.send(`4H OK | MA20 au-dessus MA50 | ma20=${avg20} | ma50=${avg50}`)
    } else {
      this.notifier.send(`4H KO | MA20 sous MA50 | ma20=${avg20} | ma50=${avg50}`)
    }

    this.notifier.send(`Score 4H terminé : ${score}/2`)

    return score
  }

  private async getH1ExecutionScore(context: StrategyContext): Promise<number> {
    this.notifier.send(`Analyse exécution 1H`)

    const candles = await this.getCandles(context.pair, '1h', 50)

    if (candles.length < 20) {
      this.notifier.send(`Pas assez de bougies 1H attendu : ${candles.length}/20`)
      return 0
    }

    const last = this.last(candles)
    const avg20 = this.average(candles.slice(-20).map((c) => c.close))

    if (last.close > avg20) {
      this.notifier.send(`1H OK | prix au-dessus MA20 | close=${last.close} | ma20=${avg20}`)
      this.notifier.send(`Score 1H terminé : 1/1`)
      return 1
    }

    this.notifier.send(`1H KO | prix sous MA20 | close=${last.close} | ma20=${avg20}`)
    this.notifier.send(`Score 1H terminé : 0/1`)

    return 0
  }

  private async getCandles(
    pair: Pair,
    interval: Interval,
    daysOrCandles: number,
  ): Promise<Candle[]> {
    const since = new Date()

    if (interval === '1d') {
      since.setDate(since.getDate() - daysOrCandles)
    } else if (interval === '4h') {
      since.setHours(since.getHours() - daysOrCandles * 4)
    } else if (interval === '1h') {
      since.setHours(since.getHours() - daysOrCandles)
    }

    this.notifier.send(
      `Récupération bougies | pair=${pair} | interval=${interval} | since=${since.toISOString()}`,
    )

    const candles = await this.store.getCandles(pair, interval, since)

    const filteredCandles = candles
      .filter((candle) => candle.close > 0)
      .sort((a, b) => {
        return a.timestamp - b.timestamp
      })

    this.notifier.send(
      `Bougies récupérées | interval=${interval} | total=${candles.length} | valides=${filteredCandles.length}`,
    )

    return filteredCandles
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  private last<T>(items: T[]): T {
    return items[items.length - 1]!
  }

  private hasHigherLows(candles: Candle[], windowSize: number): boolean {
    if (candles.length < windowSize * 3) {
      this.notifier.send(
        `Creux ascendants KO | pas assez de bougies : ${candles.length}/${windowSize * 3}`,
      )
      return false
    }

    const firstWindow = candles.slice(0, windowSize)
    const secondWindow = candles.slice(windowSize, windowSize * 2)
    const thirdWindow = candles.slice(windowSize * 2, windowSize * 3)

    const low1 = Math.min(...firstWindow.map((c) => c.low))
    const low2 = Math.min(...secondWindow.map((c) => c.low))
    const low3 = Math.min(...thirdWindow.map((c) => c.low))

    this.notifier.send(`Creux analysés | low1=${low1} | low2=${low2} | low3=${low3}`)

    return low1 < low2 && low2 < low3
  }
}

const plugin: BasePlugin = {
  name: 'trend-following',
  type: 'strategy',
  version: '1.0.0',

  setup(app) {
    app.strategies.register('trend-following', new TrendFollowingStrategy(app))
  },
}

export default plugin
