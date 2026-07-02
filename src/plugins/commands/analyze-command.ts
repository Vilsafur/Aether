import type { BasePlugin } from '../../contracts/BasePlugin.js'

const plugin: BasePlugin = {
  name: 'analyze-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('analyze', {
      name: 'analyze <symbol>',
      description: 'Analyse un symbole avec une stratégie',

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
        const symbol = context.args.values[0]

        if (!symbol) {
          throw new Error('Le symbole est obligatoire.')
        }

        const exchangeName = String(context.options.exchange ?? 'fake')
        const strategyName = String(context.options.strategy ?? 'always-buy')
        const notifierName = String(context.options.notifier ?? 'console')

        const exchange = app.exchanges.get(exchangeName)
        const strategy = app.strategies.get(strategyName)
        const notifier = app.notifiers.get(notifierName)

        const price = await exchange.getPrice(symbol)
        const decision = await strategy.analyze({ symbol, price })

        await notifier.send(
          `Décision pour ${symbol} : ${decision.action.toUpperCase()} - ${decision.reason}`,
        )
      },
    })
  },
}

export default plugin
