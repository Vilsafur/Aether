import type { BasePlugin } from '../../contracts/BasePlugin.js'
import { Pair } from '../../core/Pair.js'

const plugin: BasePlugin = {
  name: 'retrieve-fees-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('retrieve-fees', {
      name: 'retrieve-fees <pair>',
      description: 'Récupère les bougies pour un couple de devises donné',

      options: [
        {
          flags: '-e, --exchange <name>',
          description: 'Exchange à utiliser',
          defaultValue: app.config.get('plugin.exchange'),
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

        if (!pair) {
          throw new Error('Le couple de devises est obligatoire.')
        }

        const exchangeName = String(context.options.exchange ?? app.config.get('plugin.exchange'))
        const notifierName = String(context.options.notifier ?? app.config.get('plugin.notifier'))

        const exchange = app.exchanges.get(exchangeName)
        const notifier = app.notifiers.get(notifierName)

        if (!exchange.isPairSupported(pair)) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }

        pair.setHistoricalName(await exchange.getPairHistoricalName(pair))

        const fee = await exchange.getFee(pair)

        await notifier.send(
          `Récupération des frais pour le couple de devises ${pair} sur l'exchange ${exchangeName} effectuée avec succès. Prochains frais : ${fee}%`,
        )
      },
    })
  },
}

export default plugin
