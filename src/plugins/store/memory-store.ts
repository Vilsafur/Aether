import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle } from '../../contracts/Exchange.js'
import type { Store } from '../../contracts/Store.js'
import type { Pair } from '../../core/Pair.js'

class MemoryStore implements Store {
  candles: Map<string, Map<number, Candle>> = new Map()
  async saveCandle(pair: Pair, timestamp: number, candle: Candle): Promise<void> {
    if (!this.candles.has(pair.toString())) {
      this.candles.set(pair.toString(), new Map())
    }
    this.candles.get(pair.toString())?.set(timestamp, candle)
  }

  async getCandles(pair: Pair): Promise<Candle[]> {
    const pairCandles = this.candles.get(pair.toString())
    if (!pairCandles) {
      return []
    }
    return Array.from(pairCandles.values())
  }
}

const plugin: BasePlugin = {
  name: 'memory',
  type: 'storage',
  version: '1.0.0',

  setup(app) {
    app.stores.register('memory', new MemoryStore())
  },
}

export default plugin
