import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Exchange } from '../../contracts/Exchange.js'

class FakeExchange implements Exchange {
  private supportedPairs: string[] = ['BTC/USD', 'ETH/USD', 'LTC/USD']

  async getPrice(pair: string): Promise<number> {
    console.log(`Récupération du prix pour ${pair}`)

    return 42_000
  }

  async getCandles(pair: string, timeframe: string, limit: number): Promise<Candle[]> {
    console.log(`Récupération de ${limit} bougies ${timeframe} pour ${pair}`)

    return []
  }

  async getSupportedPairs(): Promise<string[]> {
    return this.supportedPairs
  }

  async isPairSupported(pair: string): Promise<boolean> {
    return this.supportedPairs.includes(pair)
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
