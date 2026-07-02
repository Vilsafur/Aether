export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Exchange {
  getPrice(symbol: string): Promise<number>;

  getCandles(
    symbol: string,
    timeframe: string,
    limit: number
  ): Promise<Candle[]>;
}