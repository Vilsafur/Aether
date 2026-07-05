import type { BasePlugin } from '../../contracts/BasePlugin.js'
import { Pair } from '../../core/Pair.js'

const plugin: BasePlugin = {
  name: 'analyze-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('analyze', {
      name: 'analyze <pair>',
      description: 'Analyse un couple de devises avec une stratégie',

      options: [
        {
          flags: '-e, --exchange <name>',
          description: 'Exchange à utiliser',
          defaultValue: app.config.get('plugin.exchange'),
        },
        {
          flags: '-s, --strategy <name>',
          description: 'Stratégie à utiliser',
          defaultValue: app.config.get('plugin.strategy'),
        },
        {
          flags: '-n, --notifier <name>',
          description: 'Notifier à utiliser',
          defaultValue: app.config.get('plugin.notifier'),
        },
      ],

      async run(context) {
        if (!context.args.values[0]) {
          throw new Error('Le couple de devises est obligatoire.')
        }

        const pair = Pair.fromString(context.args.values[0] ?? '')

        const exchangeName = String(context.options.exchange ?? app.config.get('plugin.exchange'))
        const strategyName = String(context.options.strategy ?? app.config.get('plugin.strategy'))
        const notifierName = String(context.options.notifier ?? app.config.get('plugin.notifier'))
        const storeName = String(context.options.store ?? app.config.get('plugin.store'))

        const exchange = app.exchanges.get(exchangeName)
        const store = app.stores.get(storeName)
        const strategy = app.strategies.get(strategyName)
        const notifier = app.notifiers.get(notifierName)

        if (!exchange.isPairSupported(pair)) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }
        const candles = await store.getCandles(pair)
        const decision = await strategy.analyze({ pair, candles })

        await notifier.send(
          `Décision pour ${pair} : ${decision.action.toUpperCase()} - ${decision.reason}`,
        )
      },
    })
  },
}

export default plugin
