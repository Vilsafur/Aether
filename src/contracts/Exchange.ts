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

export const getIntervalInMin = (interval: Interval): number => {
  switch (interval) {
    case '1m':
      return 1
    case '5m':
      return 5
    case '15m':
      return 15
    case '1h':
      return 60
    case '4h':
      return 240
    case '1d':
      return 1440
  }
}

export interface Exchange {
  getCandles(pair: Pair, interval: number): Promise<Candle[]>

  getPairHistoricalName(pair: Pair): Promise<string>

  getSupportedPairs(): Promise<Pair[]>

  isPairSupported(pair: Pair): Promise<boolean>

  getFee(pair: Pair): Promise<number>
}
