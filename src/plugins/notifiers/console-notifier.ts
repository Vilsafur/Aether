import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Notifier } from '../../contracts/Notifier.js'

class ConsoleNotifier implements Notifier {
  async send(message: string): Promise<void> {
    console.log(`[NOTIFICATION] ${message}`)
  }
}

const plugin: BasePlugin = {
  name: 'console',
  type: 'notifier',
  version: '1.0.0',

  setup(app) {
    app.notifiers.register('console', new ConsoleNotifier())
  },
}

export default plugin
