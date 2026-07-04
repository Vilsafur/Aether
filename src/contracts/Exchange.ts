export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Exchange {
  getPrice(pair: string): Promise<number>

  getCandles(pair: string, timeframe: string, limit: number): Promise<Candle[]>

  getSupportedPairs(): Promise<string[]>

  isPairSupported(pair: string): Promise<boolean>
}
