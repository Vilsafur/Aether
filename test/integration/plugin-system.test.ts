import { describe, expect, it, vi } from 'vitest'
import { AppContext } from '../../src/core/AppContext.js'
import { Pair } from '../../src/core/Pair.js'
import { PluginManager } from '../../src/core/PluginManager.js'
import fakeExchangePlugin from '../../src/plugins/exchanges/fake-exchange.js'
import consoleNotifierPlugin from '../../src/plugins/notifiers/console-notifier.js'
import memoryStorePlugin from '../../src/plugins/store/memory.js'
import alwaysBuyPlugin from '../../src/plugins/strategies/always-buy.js'

describe('Plugin system integration', () => {
  it('loads exchange, strategy and notifier plugins', async () => {
    const app = new AppContext()
    const manager = new PluginManager(app)

    await manager.load(fakeExchangePlugin)
    await manager.load(alwaysBuyPlugin)
    await manager.load(consoleNotifierPlugin)

    expect(app.exchanges.list()).toEqual(['fake'])
    expect(app.strategies.list()).toEqual(['always-buy'])
    expect(app.notifiers.list()).toEqual(['console'])
  })

  it('runs a complete decision flow', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const app = new AppContext()
    const manager = new PluginManager(app)

    await manager.load(fakeExchangePlugin)
    await manager.load(alwaysBuyPlugin)
    await manager.load(consoleNotifierPlugin)
    await manager.load(memoryStorePlugin)

    const strategy = app.strategies.get('always-buy')
    const notifier = app.notifiers.get('console')
    const store = app.stores.get('memory')

    const pair = Pair.fromString('BTC/USDT')
    const candles = await store.getCandles(pair)
    const decision = await strategy.analyze({ pair, candles })

    await notifier.send(decision.action)

    expect(candles).toHaveLength(0)
    expect(decision).toEqual({
      action: 'buy',
      confidence: 0.75,
      reason: 'Stratégie de test : achat systématique sur BTC/USDT à undefined',
    })

    expect(consoleSpy).toHaveBeenCalledWith('[NOTIFICATION] buy')

    consoleSpy.mockRestore()
  })
})
