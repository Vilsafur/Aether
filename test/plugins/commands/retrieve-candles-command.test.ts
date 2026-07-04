import { describe, expect, it, vi } from 'vitest'
import type { Candle } from '../../../src/contracts/Exchange.js'
import { AppContext } from '../../../src/core/AppContext.js'
import { Pair } from '../../../src/core/Pair.js'
import commandPlugin from '../../../src/plugins/commands/retrieve-candles-command.js'

describe('retrieveCandle', () => {
  it('throws when pair is missing', async () => {
    const app = new AppContext()

    commandPlugin.setup(app)

    expect(app.commands.list()).toEqual(['retrieve-candles'])

    const command = app.commands.get('retrieve-candles')

    await expect(
      command.run({
        args: {
          values: [],
        },
        options: {},
      }),
    ).rejects.toThrow('Le couple de devises est obligatoire.')
  })

  it('runs but does not retrieve candles', async () => {
    const app = new AppContext()

    const getPrice = vi.fn(async () => 42_000)
    const send = vi.fn(async () => {})

    const saveCandle = vi.fn(async () => {})

    app.exchanges.register('fake', {
      getPrice,
      getCandles: vi.fn(async () => []),
      isPairSupported: vi.fn(async () => true),
      getSupportedPairs: vi.fn(async () => [Pair.fromString('BTC/USDT')]),
      getPairHistoricalName: vi.fn(async () => 'XBTUSD'),
    })
    app.notifiers.register('console', { send })
    app.stores.register('memory', { saveCandle })

    commandPlugin.setup(app)

    const command = app.commands.get('retrieve-candles')

    await command.run({
      args: {
        values: ['BTC/USDT'],
      },
      options: {},
    })

    expect(saveCandle).toHaveBeenCalledTimes(0)
  })

  it('runs retrieve 2 candles', async () => {
    const app = new AppContext()

    const getPrice = vi.fn(async () => 42_000)
    const send = vi.fn(async () => {})

    const saveCandle = vi.fn(async (pair: Pair, timestamp: number, candle: Candle) => {
      memory.candles.push(candle)
    })
    const memory = {
      candles: [] as Candle[],
    }

    const candles: Candle[] = [
      {
        timestamp: Date.now() - 4 * 60 * 60 * 1000,
        open: 40000,
        high: 41000,
        low: 39000,
        close: 40500,
        volume: 100,
        vwap: 40250,
      },
      {
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
        open: 40500,
        high: 41500,
        low: 39500,
        close: 41000,
        volume: 150,
        vwap: 40750,
      },
    ]

    app.exchanges.register('fake', {
      getPrice,
      getCandles: vi.fn(async () => candles),
      isPairSupported: vi.fn(async () => true),
      getSupportedPairs: vi.fn(async () => [Pair.fromString('BTC/USDT')]),
      getPairHistoricalName: vi.fn(async () => 'XBTUSD'),
    })
    app.notifiers.register('console', { send })
    app.stores.register('memory', { saveCandle })

    commandPlugin.setup(app)

    const command = app.commands.get('retrieve-candles')

    await command.run({
      args: {
        values: ['BTC/USDT'],
      },
      options: {},
    })

    expect(saveCandle).toHaveBeenCalledTimes(2)
    expect(memory.candles.length).toEqual(2)
  })
})
