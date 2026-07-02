import type { BasePlugin } from "../contracts/BasePlugin.js";
import type { AppContext } from "./AppContext.js";

export class PluginManager {
  private readonly plugins = new Map<string, BasePlugin>();

  constructor(private readonly app: AppContext) {}

  async load(plugin: BasePlugin): Promise<void> {
    const key = `${plugin.type}:${plugin.name}`;

    if (this.plugins.has(key)) {
      throw new Error(`Plugin déjà chargé : ${key}`);
    }

    await plugin.setup(this.app);

    this.plugins.set(key, plugin);

    console.log(`Plugin chargé : ${key}@${plugin.version}`);
  }

  async startAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.start?.(this.app);
    }
  }

  async stopAll(): Promise<void> {
    const plugins = [...this.plugins.values()].reverse();

    for (const plugin of plugins) {
      await plugin.stop?.(this.app);
    }
  }

  list(): string[] {
    return [...this.plugins.keys()];
  }
}