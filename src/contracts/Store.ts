import type { Pair } from '../core/Pair.js'
import type { Candle } from './Exchange.js'

export interface Store {
  saveCandle(pair: Pair, timestamp: number, candle: Candle): Promise<void>
  getCandles(pair: Pair): Promise<Candle[]>
}
