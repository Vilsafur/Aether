import type { BasePlugin, PluginType } from '../contracts/BasePlugin.js'
import type { AppContext } from './AppContext.js'

type PluginKey = `${PluginType}:${string}`

export interface PluginActivationConfig {
  single: Partial<Record<PluginType, string>>
  enabled: PluginKey[]
}

export class PluginManager {
  private readonly plugins = new Map<string, BasePlugin>()

  constructor(
    private readonly app: AppContext,
    private readonly activationConfig: PluginActivationConfig,
  ) {}

  async load(plugin: BasePlugin): Promise<void> {
    const key = `${plugin.type}:${plugin.name}` as PluginKey

    if (!this.shouldLoad(plugin, key)) {
      return
    }

    if (this.plugins.has(key)) {
      throw new Error(`Plugin déjà chargé : ${key}`)
    }

    await plugin.setup(this.app)
    this.plugins.set(key, plugin)

    console.log(`Plugin chargé : ${key}@${plugin.version}`)
  }

  private shouldLoad(plugin: BasePlugin, key: PluginKey): boolean {
    if (this.activationConfig.single?.[plugin.type]) {
      return this.activationConfig.single[plugin.type] === plugin.name
    }

    return this.activationConfig.enabled.includes(key)
  }

  async startAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.start?.(this.app)
    }
  }

  async stopAll(): Promise<void> {
    for (const plugin of [...this.plugins.values()].reverse()) {
      await plugin.stop?.(this.app)
    }
  }

  list(): string[] {
    return [...this.plugins.keys()]
  }
}
