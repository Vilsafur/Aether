import type { AppContext } from '../core/AppContext.ts'

export type PluginType = 'exchange' | 'strategy' | 'notifier' | 'storage' | 'risk' | 'scheduler' | 'command'

export interface BasePlugin {
  name: string
  type: PluginType
  version: string

  setup(app: AppContext): Promise<void> | void
  start?(app: AppContext): Promise<void> | void
  stop?(app: AppContext): Promise<void> | void
}
