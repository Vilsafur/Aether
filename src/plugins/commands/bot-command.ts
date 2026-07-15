import type { BasePlugin } from '../../contracts/BasePlugin.js'
import { Pair } from '../../core/Pair.js'
import { retrieveCandles } from '../../utils/candles.js'
import { sleep } from '../../utils/time.js'

const plugin: BasePlugin = {
  name: 'bot-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('bot', {
      name: 'bot <pair>',
      description: 'Lance le bot',

      options: [],

      async run(context) {
        if (!context.args.values[0]) {
          throw new Error('Le couple de devises est obligatoire.')
        }

        const pair = Pair.fromString(context.args.values[0] ?? '')

        const exchangeName = String(app.config.get('plugin.exchange'))
        const strategyName = String(app.config.get('plugin.strategy'))
        const notifierName = String(app.config.get('plugin.notifier'))
        const storeName = String(app.config.get('plugin.store'))

        const exchange = app.exchanges.get(exchangeName)
        const store = app.stores.get(storeName)
        const strategy = app.strategies.get(strategyName)
        const notifier = app.notifiers.get(notifierName)

        if (!(await !exchange.isPairSupported(pair))) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }

        const looping = true

        while (looping) {
          const mstart = (new Date()).getTime()
          await retrieveCandles(exchange, notifier, store, pair, '1d', exchangeName)
          await retrieveCandles(exchange, notifier, store, pair, '4h', exchangeName)
          await retrieveCandles(exchange, notifier, store, pair, '1h', exchangeName)

          const decision = await strategy.analyze({ pair })

          await notifier.send(
            `Décision pour ${pair} : ${decision.action.toUpperCase()} - ${decision.reason}`,
          )

          const mfinish = (new Date()).getTime()
          const diff = (3600000 - (mfinish - mstart))

          await notifier.send(
            `Attente de ${diff/1000}s avant la prochaine exécution`,
          )

          await sleep(diff)
        }
      },
    })
  },
}

export default plugin
