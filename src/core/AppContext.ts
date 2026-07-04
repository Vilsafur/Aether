import type { AppCommand } from '../contracts/Command.js'
import type { Exchange } from '../contracts/Exchange.js'
import type { Notifier } from '../contracts/Notifier.js'
import type { Store } from '../contracts/Store.js'
import type { Strategy } from '../contracts/Strategy.js'
import { Registry } from './Registry.js'

export class AppContext {
  readonly exchanges = new Registry<Exchange>('exchange')
  readonly strategies = new Registry<Strategy>('strategy')
  readonly notifiers = new Registry<Notifier>('notifier')
  readonly commands = new Registry<AppCommand>('command')
  readonly stores = new Registry<Store>('storage')
}
