import { describe, expect, it, vi } from 'vitest'
import { AppContext } from '../../../src/core/AppContext.js'
import { Pair } from '../../../src/core/Pair.js'
import commandPlugin from '../../../src/plugins/commands/analyze-command.js'

describe('command plugin', () => {
  it('registers the analyze command', () => {
    const app = new AppContext()

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

    const getPrice = vi.fn(async () => 42_000)
    const analyze = vi.fn(async () => ({
      action: 'buy' as const,
      confidence: 0.75,
      reason: 'Signal de test',
    }))
    const send = vi.fn(async () => {})

    app.exchanges.register('fake', {
      getPrice,
      getCandles: vi.fn(async () => []),
      isPairSupported: vi.fn(async () => true),
      getSupportedPairs: vi.fn(async () => [Pair.fromString('BTC/USDT')]),
      getPairHistoricalName: vi.fn(async () => 'XBTUSD'),
    })
    app.strategies.register('always-buy', { analyze })
    app.notifiers.register('console', { send })

    commandPlugin.setup(app)

    const command = app.commands.get('analyze')

    await command.run({
      args: {
        values: ['BTC/USDT'],
      },
      options: {},
    })

    expect(getPrice).toHaveBeenCalledWith(Pair.fromString('BTC/USDT'))
    expect(analyze).toHaveBeenCalledWith({
      pair: Pair.fromString('BTC/USDT'),
      price: 42_000,
    })
    expect(send).toHaveBeenCalledWith('Décision pour BTC/USDT : BUY - Signal de test')
  })

  it('runs analyze flow with custom services', async () => {
    const app = new AppContext()

    const getPrice = vi.fn(async () => 2_500)
    const analyze = vi.fn(async () => ({
      action: 'hold' as const,
      confidence: 0.5,
      reason: 'Pas assez de signal',
    }))
    const send = vi.fn(async () => {})

    app.exchanges.register('binance', {
      getPrice,
      getCandles: vi.fn(async () => []),
      isPairSupported: vi.fn(async () => true),
      getSupportedPairs: vi.fn(async () => [Pair.fromString('ETH/USDT')]),
      getPairHistoricalName: vi.fn(async () => 'ETH-USDT'),
    })
    app.strategies.register('rsi', { analyze })
    app.notifiers.register('telegram', { send })

    commandPlugin.setup(app)

    const command = app.commands.get('analyze')

    await command.run({
      args: {
        values: ['ETH/USDT'],
      },
      options: {
        exchange: 'binance',
        strategy: 'rsi',
        notifier: 'telegram',
      },
    })

    expect(getPrice).toHaveBeenCalledWith(Pair.fromString('ETH/USDT'))
    expect(analyze).toHaveBeenCalledWith({
      pair: Pair.fromString('ETH/USDT'),
      price: 2_500,
    })
    expect(send).toHaveBeenCalledWith('Décision pour ETH/USDT : HOLD - Pas assez de signal')
  })
})
