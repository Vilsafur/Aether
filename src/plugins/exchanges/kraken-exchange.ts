import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Exchange } from '../../contracts/Exchange.js'
import type { AppContext } from '../../core/AppContext.js'
import { Pair } from '../../core/Pair.js'
import { KrakenClient } from '../../utils/kraken-client.js'

type KrakenOHLCResponse = {
  error: string[]
  result: {
    last: string
    [pair: string]: unknown
  }
}

type KrakenTradeVolumeResponse = {
  error: string[]
  result: {
    currency: string
    volume: string
    // Frais taker par paire
    fees?: Record<string, KrakenTradeVolumeFee>
    // Frais maker par paire
    fees_maker?: Record<string, KrakenTradeVolumeFee>
  }
}

type KrakenTradeVolumeFee = {
  fee: string
  minfee: string
  maxfee: string
  nextfee: string
  nextvolume: string
  tiervolume: string
}

class KrakenExchange implements Exchange {
  private supportedPairs: Pair[] = [Pair.fromString('BTC/EUR'), Pair.fromString('ETH/EUR')]
  private app: AppContext
  private client: KrakenClient

  constructor(app: AppContext) {
    this.app = app

    this.client = new KrakenClient(
      app.config.get('kraken.baseUrl'),
      app.config.get('kraken.api.key'),
      app.config.get('kraken.api.secret'),
    )
  }

  async getCandles(pair: Pair, interval: number): Promise<Candle[]> {
    const notifier = this.app.notifiers.get(String(this.app.config.get('plugin.notifier')))
    await notifier.send(`Récupération des bougies pour ${pair}`)
    let historicalName = pair.getHistoricalName()
    if (historicalName === undefined) {
      historicalName = await this.getPairHistoricalName(pair)
      pair.setHistoricalName(historicalName)
    }

    const result = await this.client.publicRequest<KrakenOHLCResponse>('/0/public/OHLC', {
      pair: historicalName,
      interval: interval,
    })

    if (result.error.length > 0) {
      throw new Error(`Kraken API error: ${result.error.join(', ')}`)
    }

    const ohlcData = result.result[historicalName] as unknown as number[][]

    return ohlcData.map((data) => ({
      timestamp: data[0]!,
      open: data[1]!,
      high: data[2]!,
      low: data[3]!,
      close: data[4]!,
      volume: data[6]!,
      vwap: data[5]!,
    }))
  }

  async getPairHistoricalName(pair: Pair): Promise<string> {
    if (pair.equals(Pair.fromString('BTC/EUR'))) {
      return 'XXBTZEUR'
    }
    throw new Error(`No historical name defined for pair ${pair}`)
  }

  async getSupportedPairs(): Promise<Pair[]> {
    return this.supportedPairs
  }

  async isPairSupported(pair: Pair): Promise<boolean> {
    for (const supportedPair of this.supportedPairs) {
      if (pair.equals(supportedPair)) {
        return true
      }
    }
    return false
  }

  async getFee(pair: Pair): Promise<number> {
    const pairHistoricalName = pair.getHistoricalName()
    if (!pairHistoricalName) {
      throw new Error(`Pas de nom historique pour la pair ${pair}`)
    }

    const response = await this.client.privateRequest<KrakenTradeVolumeResponse>(
      '/0/private/TradeVolume',
      { pair: pairHistoricalName },
    )
    if (response.error.length > 0) {
      throw new Error(response.error.join(', '))
    }

    if (response.result.fees === undefined) {
      throw new Error('Pas de frais récupéré')
    }

    const feeByPair = response.result.fees[pairHistoricalName]

    if (!feeByPair) {
      throw new Error(`Pas de frais trouvés pour la pair ${pair}`)
    }

    return parseFloat(feeByPair.fee) * 100
  }
}

const plugin: BasePlugin = {
  name: 'kraken',
  type: 'exchange',
  version: '1.0.0',

  setup(app) {
    console.info('Setting up Kraken exchange plugin...')
    app.exchanges.register('kraken', new KrakenExchange(app))
  },
}

export default plugin
