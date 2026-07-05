import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import Database, { type Database as DatabaseType } from 'better-sqlite3'
import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Candle } from '../../contracts/Exchange.js'
import type { Store } from '../../contracts/Store.js'
import type { Pair } from '../../core/Pair.js'

interface CandleRow {
  pair: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap: number
}

class SQLiteStore implements Store {
  private readonly db: DatabaseType

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)

    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')

    this.runMigrations()
  }

  private runMigrations(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const migrationsDir = join(import.meta.dirname, 'sqliteMigrations')

    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    const hasMigration = this.db.prepare(`
      SELECT 1 FROM _migrations WHERE name = ?
    `)

    const insertMigration = this.db.prepare(`
      INSERT INTO _migrations (name) VALUES (?)
    `)

    const transaction = this.db.transaction(() => {
      for (const file of migrationFiles) {
        const alreadyApplied = hasMigration.get(file)

        if (alreadyApplied) {
          continue
        }

        const sql = readFileSync(join(migrationsDir, file), 'utf8')

        this.db.exec(sql)
        insertMigration.run(file)
      }
    })

    transaction()
  }

  close(): void {
    this.db.close()
  }

  async saveCandle(pair: Pair, timestamp: number, candle: Candle): Promise<void> {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO candles (pair, timestamp, open, high, low, close, volume, vwap) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    stmt.run(
      pair.toString(),
      timestamp,
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume,
      candle.vwap,
    )
  }

  async getCandles(pair: Pair): Promise<Candle[]> {
    const stmt = this.db.prepare(`SELECT * FROM candles WHERE pair = ? ORDER BY timestamp ASC`)
    const candleRows = stmt.all(pair.toString()) as CandleRow[]

    return candleRows.map((row) => ({
      pair: pair,
      timestamp: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
      vwap: row.vwap,
    }))
  }
}

const plugin: BasePlugin = {
  name: 'sqlite',
  type: 'store',
  version: '1.0.0',

  setup(app) {
    const dbPath = app.config.get('sqlite.path')
    app.stores.register('sqlite', new SQLiteStore(dbPath))
  },

  stop(app) {
    const store = app.stores.get('sqlite') as SQLiteStore
    const notifier = app.notifiers.get('console')
    notifier.send('Fermeture de la base de données SQLite...')
    store.close()
  },
}

export default plugin
