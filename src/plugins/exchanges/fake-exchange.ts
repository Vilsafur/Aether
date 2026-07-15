import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Exchange } from '../../contracts/Exchange.js'
import type { AppContext } from '../../core/AppContext.js'
import { Pair } from '../../core/Pair.js'

class FakeExchange implements Exchange {
  private supportedPairs: Pair[] = [Pair.fromString('XTC/EUR'), Pair.fromString('ETH/EUR')]
  private app: AppContext

  constructor(app: AppContext) {
    this.app = app
  }

  async getCandles(pair: Pair, _interval: number): Promise<Candle[]> {
    const notifierName = String(this.app.config.get('plugin.notifier'))
    const notifier = this.app.notifiers.get(notifierName)
    await notifier.send(`Récupération des bougies pour ${pair}`)

    return [
      {
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        open: 40000,
        high: 41000,
        low: 39000,
        close: 40500,
        volume: 100,
        vwap: 40250,
      },
      {
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
        open: 40500,
        high: 41500,
        low: 39500,
        close: 41000,
        volume: 150,
        vwap: 40750,
      },
    ]
  }

  async getPairHistoricalName(pair: Pair): Promise<string> {
    if (pair.equals(Pair.fromString('BTC/EUR'))) {
      return 'XBTEUR'
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
    if (pair.equals(Pair.fromString('BTC/EUR'))) {
      return 0.001
    }
    if (pair.equals(Pair.fromString('ETH/EUR'))) {
      return 0.002
    }
    throw new Error(`No fee defined for pair ${pair}`)
  }
}

const plugin: BasePlugin = {
  name: 'fake',
  type: 'exchange',
  version: '1.0.0',

  setup(app) {
    app.exchanges.register('fake', new FakeExchange(app))
  },
}

export default plugin
