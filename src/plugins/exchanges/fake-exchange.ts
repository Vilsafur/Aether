import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle, Exchange } from '../../contracts/Exchange.js'

class FakeExchange implements Exchange {
  async getPrice(symbol: string): Promise<number> {
    console.log(`Récupération du prix pour ${symbol}`)

    return 42_000
  }

  async getCandles(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    console.log(`Récupération de ${limit} bougies ${timeframe} pour ${symbol}`)

    return []
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
