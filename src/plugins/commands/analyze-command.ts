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
          defaultValue: app.config.get('defaultExchange'),
        },
        {
          flags: '-s, --strategy <name>',
          description: 'Stratégie à utiliser',
          defaultValue: app.config.get('defaultStrategy'),
        },
        {
          flags: '-n, --notifier <name>',
          description: 'Notifier à utiliser',
          defaultValue: app.config.get('defaultNotifier'),
        },
      ],

      async run(context) {
        if (!context.args.values[0]) {
          throw new Error('Le couple de devises est obligatoire.')
        }

        const pair = Pair.fromString(context.args.values[0] ?? '')

        const exchangeName = String(context.options.exchange ?? app.config.get('defaultExchange'))
        const strategyName = String(context.options.strategy ?? app.config.get('defaultStrategy'))
        const notifierName = String(context.options.notifier ?? app.config.get('defaultNotifier'))

        const exchange = app.exchanges.get(exchangeName)
        const strategy = app.strategies.get(strategyName)
        const notifier = app.notifiers.get(notifierName)

        if (!exchange.isPairSupported(pair)) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }

        const price = await exchange.getPrice(pair)
        const decision = await strategy.analyze({ pair, price })

        await notifier.send(
          `Décision pour ${pair} : ${decision.action.toUpperCase()} - ${decision.reason}`,
        )
      },
    })
  },
}

export default plugin
