import type { BasePlugin } from '../../contracts/BasePlugin.js'

const plugin: BasePlugin = {
  name: 'retrieve-candle-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('retrieve-candle', {
      name: 'retrieve-candle <pair>',
      description: 'Récupère les bougies pour un couple de devises donné',

      options: [
        {
          flags: '-e, --exchange <name>',
          description: 'Exchange à utiliser',
          defaultValue: 'fake',
        },
        {
          flags: '-s, --strategy <name>',
          description: 'Stratégie à utiliser',
          defaultValue: 'always-buy',
        },
        {
          flags: '-n, --notifier <name>',
          description: 'Notifier à utiliser',
          defaultValue: 'console',
        },
      ],

      async run(context) {
        const pair = context.args.values[0]

        if (!pair) {
          throw new Error('Le couple de devises est obligatoire.')
        }

        const exchangeName = String(context.options.exchange ?? 'fake')
        const strategyName = String(context.options.strategy ?? 'always-buy')
        const notifierName = String(context.options.notifier ?? 'console')

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
