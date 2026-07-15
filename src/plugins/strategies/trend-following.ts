import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Interval } from '../../contracts/Exchange.js'
import type { Notifier } from '../../contracts/Notifier.js'
import type { Store } from '../../contracts/Store.js'
import type {
  Strategy,
  StrategyContext,
  StrategyDecision,
} from '../../contracts/Strategy.js'
import type { AppContext } from '../../core/AppContext.js'
import type { Pair } from '../../core/Pair.js'

type TrendDirection =
  | 'bullish'
  | 'bearish'
  | 'neutral'
  | 'insufficient'

interface TimeframeAnalysis {
  direction: TrendDirection
  strength: number
  reason: string
}

class TrendFollowingStrategy implements Strategy {
  private readonly store: Store
  private readonly notifier: Notifier

  constructor(private readonly app: AppContext) {
    this.store = this.app.stores.get(
      this.app.config.get('plugin.store'),
    )

    this.notifier = this.app.notifiers.get(
      this.app.config.get('plugin.notifier'),
    )
  }

  async analyze(
    context: StrategyContext,
  ): Promise<StrategyDecision> {
    await this.notifier.send(
      `Analyse Trend Following démarrée pour ${context.pair}`,
    )

    const daily = await this.analyzeDailyTrend(context)
    const h4 = await this.analyzeH4Confirmation(context)
    const h1 = await this.analyzeH1Execution(context)

    const action = this.determineAction(daily, h4, h1)

    const confidence = this.calculateConfidence(
      action,
      daily,
      h4,
      h1,
    )

    const reason = [
      `Trend Following ${context.pair}`,
      `daily=${daily.direction}`,
      `h4=${h4.direction}`,
      `h1=${h1.direction}`,
      `action=${action}`,
      `confidence=${confidence}`,
    ].join(' | ')

    await this.notifier.send(
      [
        'Décision stratégie',
        `pair=${context.pair}`,
        `daily=${daily.direction}`,
        `h4=${h4.direction}`,
        `h1=${h1.direction}`,
        `action=${action}`,
        `confidence=${confidence}`,
      ].join(' | '),
    )

    return {
      action,
      confidence,
      reason,
    }
  }

  private determineAction(
    daily: TimeframeAnalysis,
    h4: TimeframeAnalysis,
    h1: TimeframeAnalysis,
  ): 'buy' | 'sell' | 'hold' {
    const analyses = [daily, h4, h1]

    if (
      analyses.some(
        (analysis) => analysis.direction === 'insufficient',
      )
    ) {
      return 'hold'
    }

    if (
      daily.direction === 'bullish' &&
      h4.direction === 'bullish' &&
      h1.direction === 'bullish'
    ) {
      return 'buy'
    }

    if (
      daily.direction === 'bearish' &&
      h4.direction === 'bearish' &&
      h1.direction === 'bearish'
    ) {
      return 'sell'
    }

    return 'hold'
  }

  private calculateConfidence(
    action: 'buy' | 'sell' | 'hold',
    daily: TimeframeAnalysis,
    h4: TimeframeAnalysis,
    h1: TimeframeAnalysis,
  ): number {
    if (action === 'hold') {
      return this.calculateHoldConfidence(daily, h4, h1)
    }
    const confidence =
      daily.strength * 0.5 +
      h4.strength * 0.3 +
      h1.strength * 0.2

    return this.roundConfidence(confidence)
  }

  private calculateHoldConfidence(
    daily: TimeframeAnalysis,
    h4: TimeframeAnalysis,
    h1: TimeframeAnalysis,
  ): number {
    if (
      daily.direction === 'insufficient' ||
      h4.direction === 'insufficient' ||
      h1.direction === 'insufficient'
    ) {
      return 1
    }

    const directions = [
      daily.direction,
      h4.direction,
      h1.direction,
    ]

    const bullishCount = directions.filter(
      (direction) => direction === 'bullish',
    ).length

    const bearishCount = directions.filter(
      (direction) => direction === 'bearish',
    ).length

    const neutralCount = directions.filter(
      (direction) => direction === 'neutral',
    ).length

    const disagreement =
      neutralCount > 0 || (bullishCount > 0 && bearishCount > 0)

    return disagreement ? 0.9 : 0.6
  }

  private async analyzeDailyTrend(
    context: StrategyContext,
  ): Promise<TimeframeAnalysis> {
    await this.notifier.send(
      'Analyse de la tendance principale 1D',
    )

    const candles = await this.getCandles(
      context.pair,
      '1d',
      230,
    )

    if (candles.length < 220) {
      const reason =
        `Pas assez de bougies 1D : ${candles.length}/220`

      await this.notifier.send(reason)

      return {
        direction: 'insufficient',
        strength: 0,
        reason,
      }
    }

    const last = this.last(candles)

    const ma50 = this.average(
      candles.slice(-50).map((candle) => candle.close),
    )

    const ma200 = this.average(
      candles.slice(-200).map((candle) => candle.close),
    )

    const previousMa200 = this.average(
      candles
        .slice(-220, -20)
        .map((candle) => candle.close),
    )

    const bullish =
      last.close > ma200 &&
      ma50 > ma200 &&
      ma200 > previousMa200

    const bearish =
      last.close < ma200 &&
      ma50 < ma200 &&
      ma200 < previousMa200

    const priceDistance = this.relativeDistance(
      last.close,
      ma200,
    )

    const averageDistance = this.relativeDistance(
      ma50,
      ma200,
    )

    const slopeDistance = this.relativeDistance(
      ma200,
      previousMa200,
    )

    const strength = this.average([
      this.normalizeDistance(priceDistance, 0.1),
      this.normalizeDistance(averageDistance, 0.08),
      this.normalizeDistance(slopeDistance, 0.03),
    ])

    let direction: TrendDirection = 'neutral'

    if (bullish) {
      direction = 'bullish'
    } else if (bearish) {
      direction = 'bearish'
    }

    const reason = [
      `1D ${direction}`,
      `close=${last.close}`,
      `ma50=${ma50}`,
      `ma200=${ma200}`,
      `previousMa200=${previousMa200}`,
      `strength=${this.roundConfidence(strength)}`,
    ].join(' | ')

    await this.notifier.send(reason)

    return {
      direction,
      strength,
      reason,
    }
  }

  private async analyzeH4Confirmation(
    context: StrategyContext,
  ): Promise<TimeframeAnalysis> {
    await this.notifier.send('Analyse de confirmation 4H')

    const candles = await this.getCandles(
      context.pair,
      '4h',
      120,
    )

    if (candles.length < 50) {
      const reason =
        `Pas assez de bougies 4H : ${candles.length}/50`

      await this.notifier.send(reason)

      return {
        direction: 'insufficient',
        strength: 0,
        reason,
      }
    }

    const last = this.last(candles)

    const ma20 = this.average(
      candles.slice(-20).map((candle) => candle.close),
    )

    const ma50 = this.average(
      candles.slice(-50).map((candle) => candle.close),
    )

    const bullish =
      last.close > ma50 &&
      ma20 > ma50

    const bearish =
      last.close < ma50 &&
      ma20 < ma50

    const priceDistance = this.relativeDistance(
      last.close,
      ma50,
    )

    const averageDistance = this.relativeDistance(
      ma20,
      ma50,
    )

    const strength = this.average([
      this.normalizeDistance(priceDistance, 0.05),
      this.normalizeDistance(averageDistance, 0.03),
    ])

    let direction: TrendDirection = 'neutral'

    if (bullish) {
      direction = 'bullish'
    } else if (bearish) {
      direction = 'bearish'
    }

    const reason = [
      `4H ${direction}`,
      `close=${last.close}`,
      `ma20=${ma20}`,
      `ma50=${ma50}`,
      `strength=${this.roundConfidence(strength)}`,
    ].join(' | ')

    await this.notifier.send(reason)

    return {
      direction,
      strength,
      reason,
    }
  }

  private async analyzeH1Execution(
    context: StrategyContext,
  ): Promise<TimeframeAnalysis> {
    await this.notifier.send('Analyse d’exécution 1H')

    const candles = await this.getCandles(
      context.pair,
      '1h',
      60,
    )

    if (candles.length < 21) {
      const reason =
        `Pas assez de bougies 1H : ${candles.length}/21`

      await this.notifier.send(reason)

      return {
        direction: 'insufficient',
        strength: 0,
        reason,
      }
    }

    const last = this.last(candles)

    const currentMa20 = this.average(
      candles.slice(-20).map((candle) => candle.close),
    )

    const previousMa20 = this.average(
      candles.slice(-21, -1).map((candle) => candle.close),
    )

    const bullish =
      last.close > currentMa20 &&
      currentMa20 > previousMa20

    const bearish =
      last.close < currentMa20 &&
      currentMa20 < previousMa20

    const priceDistance = this.relativeDistance(
      last.close,
      currentMa20,
    )

    const slopeDistance = this.relativeDistance(
      currentMa20,
      previousMa20,
    )

    const strength = this.average([
      this.normalizeDistance(priceDistance, 0.02),
      this.normalizeDistance(slopeDistance, 0.005),
    ])

    let direction: TrendDirection = 'neutral'

    if (bullish) {
      direction = 'bullish'
    } else if (bearish) {
      direction = 'bearish'
    }

    const reason = [
      `1H ${direction}`,
      `close=${last.close}`,
      `ma20=${currentMa20}`,
      `previousMa20=${previousMa20}`,
      `strength=${this.roundConfidence(strength)}`,
    ].join(' | ')

    await this.notifier.send(reason)

    return {
      direction,
      strength,
      reason,
    }
  }

  private async getCandles(
    pair: Pair,
    interval: Interval,
    candlesCount: number,
  ): Promise<Candle[]> {
    const since = new Date()

    if (interval === '1d') {
      since.setDate(since.getDate() - candlesCount)
    } else if (interval === '4h') {
      since.setHours(
        since.getHours() - candlesCount * 4,
      )
    } else if (interval === '1h') {
      since.setHours(
        since.getHours() - candlesCount,
      )
    }

    await this.notifier.send(
      [
        'Récupération bougies',
        `pair=${pair}`,
        `interval=${interval}`,
        `since=${since.toISOString()}`,
      ].join(' | '),
    )

    const candles = await this.store.getCandles(
      pair,
      interval,
      since,
    )

    const uniqueCandles = new Map<number, Candle>()

    for (const candle of candles) {
      if (!this.isValidCandle(candle)) {
        continue
      }

      uniqueCandles.set(candle.timestamp, candle)
    }

    const filteredCandles = Array.from(
      uniqueCandles.values(),
    ).sort(
      (first, second) =>
        first.timestamp - second.timestamp,
    )

    await this.notifier.send(
      [
        'Bougies récupérées',
        `interval=${interval}`,
        `total=${candles.length}`,
        `valides=${filteredCandles.length}`,
      ].join(' | '),
    )

    return filteredCandles
  }

  private isValidCandle(candle: Candle): boolean {
    const values = [
      candle.timestamp,
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume,
      candle.vwap,
    ]

    if (
      values.some(
        (value) =>
          !Number.isFinite(value),
      )
    ) {
      return false
    }

    if (
      candle.timestamp <= 0 ||
      candle.open <= 0 ||
      candle.high <= 0 ||
      candle.low <= 0 ||
      candle.close <= 0 ||
      candle.volume < 0 ||
      candle.vwap <= 0
    ) {
      return false
    }

    if (
      candle.high < candle.low ||
      candle.high < candle.open ||
      candle.high < candle.close ||
      candle.low > candle.open ||
      candle.low > candle.close
    ) {
      return false
    }

    return true
  }

  private relativeDistance(
    value: number,
    reference: number,
  ): number {
    if (reference === 0) {
      return 0
    }

    return Math.abs(
      (value - reference) / reference,
    )
  }

  private normalizeDistance(
    distance: number,
    strongDistance: number,
  ): number {
    if (strongDistance <= 0) {
      return 0
    }

    return this.clamp(
      distance / strongDistance,
      0,
      1,
    )
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0
    }

    return (
      values.reduce(
        (sum, value) => sum + value,
        0,
      ) / values.length
    )
  }

  private last<T>(items: T[]): T {
    const item = items.at(-1)

    if (item === undefined) {
      throw new Error(
        'Impossible de récupérer le dernier élément d’une liste vide.',
      )
    }

    return item
  }

  private clamp(
    value: number,
    minimum: number,
    maximum: number,
  ): number {
    return Math.min(
      Math.max(value, minimum),
      maximum,
    )
  }

  private roundConfidence(value: number): number {
    return Number(
      this.clamp(value, 0, 1).toFixed(2),
    )
  }
}

const plugin: BasePlugin = {
  name: 'trend-following',
  type: 'strategy',
  version: '2.0.0',

  setup(app) {
    app.strategies.register(
      'trend-following',
      new TrendFollowingStrategy(app),
    )
  },
}

export default plugin