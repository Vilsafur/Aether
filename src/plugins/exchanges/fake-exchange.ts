import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Exchange } from '../../contracts/Exchange.js'
import { Pair } from '../../core/Pair.js'

class FakeExchange implements Exchange {
  private supportedPairs: Pair[] = [Pair.fromString('BTC/EUR'), Pair.fromString('ETH/EUR')]

  async getCandles(pair: Pair): Promise<Candle[]> {
    console.log(`Récupération des bougies pour ${pair}`)

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
}

const plugin: BasePlugin = {
  name: 'fake-exchange',
  type: 'exchange',
  version: '1.0.0',

  setup(app) {
    app.exchanges.register('fake', new FakeExchange())
  },
}

export default plugin
