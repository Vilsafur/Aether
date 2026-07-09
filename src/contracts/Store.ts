import type { Pair } from '../core/Pair.js'
import type { Candle, Interval } from './Exchange.js'

export interface Store {
  saveCandle(
    exchange: string,
    pair: Pair,
    timestamp: number,
    interval: Interval,
    candle: Candle,
  ): Promise<void>
  getCandles(pair: Pair, interval: Interval, since?: Date): Promise<Candle[]>
}
