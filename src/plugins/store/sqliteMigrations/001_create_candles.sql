CREATE TABLE candles (
  exchange TEXT NOT NULL,
  pair TEXT NOT NULL,
  interval TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  vwap REAL NOT NULL,
  PRIMARY KEY (pair, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_candles_pair_timestamp
ON candles (pair, timestamp);
