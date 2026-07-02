import { describe, expect, it, vi } from 'vitest'
import type { BasePlugin } from '../../src/contracts/BasePlugin.js'
import { AppContext } from '../../src/core/AppContext.js'
import { PluginManager } from '../../src/core/PluginManager.js'

describe('PluginManager', () => {
  it('loads a plugin', async () => {
    const app = new AppContext()
    const manager = new PluginManager(app)

    const plugin: BasePlugin = {
      name: 'test',
      type: 'notifier',
      version: '1.0.0',
      setup: vi.fn(),
    }

    await manager.load(plugin)

    expect(plugin.setup).toHaveBeenCalledWith(app)
    expect(manager.list()).toEqual(['notifier:test'])
  })

  it('throws when loading the same plugin twice', async () => {
    const app = new AppContext()
    const manager = new PluginManager(app)

    const plugin: BasePlugin = {
      name: 'test',
      type: 'notifier',
      version: '1.0.0',
      setup: vi.fn(),
    }

    await manager.load(plugin)

    await expect(manager.load(plugin)).rejects.toThrow('Plugin déjà chargé : notifier:test')
  })

  it('starts all plugins', async () => {
    const app = new AppContext()
    const manager = new PluginManager(app)

    const plugin: BasePlugin = {
      name: 'test',
      type: 'notifier',
      version: '1.0.0',
      setup: vi.fn(),
      start: vi.fn(),
    }

    await manager.load(plugin)
    await manager.startAll()

    expect(plugin.start).toHaveBeenCalledWith(app)
  })

  it('stops plugins in reverse order', async () => {
    const app = new AppContext()
    const manager = new PluginManager(app)

    const calls: string[] = []

    const pluginA: BasePlugin = {
      name: 'a',
      type: 'notifier',
      version: '1.0.0',
      setup: vi.fn(),
      stop: vi.fn(() => {
        calls.push('a')
      }),
    }

    const pluginB: BasePlugin = {
      name: 'b',
      type: 'notifier',
      version: '1.0.0',
      setup: vi.fn(),
      stop: vi.fn(() => {
        calls.push('b')
      }),
    }

    await manager.load(pluginA)
    await manager.load(pluginB)

    await manager.stopAll()

    expect(calls).toEqual(['b', 'a'])
  })
})
