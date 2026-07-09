import { describe, expect, it, vi } from 'vitest'
import type { Candle, Interval } from '../../../src/contracts/Exchange.js'
import { AppContext } from '../../../src/core/AppContext.js'
import { Pair } from '../../../src/core/Pair.js'
import commandPlugin from '../../../src/plugins/commands/analyze-command.js'

describe('command plugin', () => {
  it('registers the analyze command', () => {
    const app = new AppContext()
    process.env['PLUGIN_EXCHANGE'] = 'fake'
    process.env['PLUGIN_STORE'] = 'memory'

    commandPlugin.setup(app)

    expect(app.commands.list()).toEqual(['analyze'])

    const command = app.commands.get('analyze')

    expect(command.name).toBe('analyze <pair>')
    expect(command.description).toBe('Analyse un couple de devises avec une stratégie')
    expect(command.options).toEqual([
      {
        flags: '-e, --exchange <name>',
        description: 'Exchange à utiliser',
        defaultValue: 'fake',
      },
      {
        flags: '-s, --strategy <name>',
        description: 'Stratégie à utiliser',
        defaultValue: 'always-buy',
      },
      {
        flags: '-n, --notifier <name>',
        description: 'Notifier à utiliser',
        defaultValue: 'console',
      },
    ])
  })

  it('throws when pair is missing', async () => {
    const app = new AppContext()
    process.env['PLUGIN_EXCHANGE'] = 'fake'
    process.env['PLUGIN_STORE'] = 'memory'

    commandPlugin.setup(app)

    const command = app.commands.get('analyze')

    await expect(
      command.run({
        args: {
          values: [],
        },
        options: {},
      }),
    ).rejects.toThrow('Le couple de devises est obligatoire.')
  })

  it('runs analyze flow with default services', async () => {
    const app = new AppContext()
    process.env['PLUGIN_EXCHANGE'] = 'fake'
    process.env['PLUGIN_STORE'] = 'memory'

    const analyze = vi.fn(async () => ({
      action: 'buy' as const,
      confidence: 0.75,
      reason: 'Signal de test',
    }))
    const send = vi.fn(async () => {})

    app.exchanges.register('fake', {
      getCandles: vi.fn(async () => []),
      isPairSupported: vi.fn(async () => true),
      getSupportedPairs: vi.fn(async () => [Pair.fromString('BTC/USDT')]),
      getPairHistoricalName: vi.fn(async () => 'XBTUSD'),
      getFee: vi.fn(async () => 0.4),
    })
    app.strategies.register('always-buy', { analyze })
    app.notifiers.register('console', { send })
    app.stores.register('memory', {
      getCandles: vi.fn(async () => []),
      saveCandle: vi.fn(
        async (
          _exchange: string,
          _pair: Pair,
          _timestamp: number,
          _interval: Interval,
          _candle: Candle,
        ) => {},
      ),
    })

    commandPlugin.setup(app)

    const command = app.commands.get('analyze')

    await command.run({
      args: {
        values: ['BTC/USDT'],
      },
      options: {},
    })

    expect(analyze).toHaveBeenCalledWith({
      pair: Pair.fromString('BTC/USDT'),
    })
    expect(send).toHaveBeenCalledWith('Décision pour BTC/USDT : BUY - Signal de test')
  })

  it('runs analyze flow with custom services', async () => {
    const app = new AppContext()
    process.env['PLUGIN_EXCHANGE'] = 'fake'
    process.env['PLUGIN_STORE'] = 'memory'

    const analyze = vi.fn(async () => ({
      action: 'hold' as const,
      confidence: 0.5,
      reason: 'Pas assez de signal',
    }))
    const send = vi.fn(async () => {})

    app.exchanges.register('fake', {
      getCandles: vi.fn(async () => []),
      isPairSupported: vi.fn(async () => true),
      getSupportedPairs: vi.fn(async () => [Pair.fromString('ETH/USDT')]),
      getPairHistoricalName: vi.fn(async () => 'ETH-USDT'),
      getFee: vi.fn(async () => 0.4),
    })
    app.strategies.register('rsi', { analyze })
    app.notifiers.register('telegram', { send })
    app.stores.register('memory', {
      getCandles: vi.fn(async () => []),
      saveCandle: vi.fn(
        async (
          _exchange: string,
          _pair: Pair,
          _timestamp: number,
          _interval: Interval,
          _candle: Candle,
        ) => {},
      ),
    })

    commandPlugin.setup(app)

    const command = app.commands.get('analyze')

    await command.run({
      args: {
        values: ['ETH/USDT'],
      },
      options: {
        exchange: 'fake',
        strategy: 'rsi',
        notifier: 'telegram',
      },
    })

    expect(analyze).toHaveBeenCalledWith({
      pair: Pair.fromString('ETH/USDT'),
    })
    expect(send).toHaveBeenCalledWith('Décision pour ETH/USDT : HOLD - Pas assez de signal')
  })
})
