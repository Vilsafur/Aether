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

export type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export interface Exchange {
  getCandles(pair: Pair, interval: number): Promise<Candle[]>

  getPairHistoricalName(pair: Pair): Promise<string>

  getSupportedPairs(): Promise<Pair[]>

  isPairSupported(pair: Pair): Promise<boolean>

  getFee(pair: Pair): Promise<number>
}
