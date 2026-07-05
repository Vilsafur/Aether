import type { Pair } from '../core/Pair.js'

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap: number
}

export interface Exchange {
  getCandles(pair: Pair, interval: number): Promise<Candle[]>

  getPairHistoricalName(pair: Pair): Promise<string>

  getSupportedPairs(): Promise<Pair[]>

  isPairSupported(pair: Pair): Promise<boolean>
}
