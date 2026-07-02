import type { Exchange } from '../contracts/Exchange.js'
import type { Notifier } from '../contracts/Notifier.js'
import type { Strategy } from '../contracts/Strategy.js'
import { Registry } from './Registry.js'

export class AppContext {
  readonly exchanges = new Registry<Exchange>('exchange')
  readonly strategies = new Registry<Strategy>('strategy')
  readonly notifiers = new Registry<Notifier>('notifier')
}
