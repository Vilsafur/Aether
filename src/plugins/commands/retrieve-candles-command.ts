import type { BasePlugin } from '../../contracts/BasePlugin.js'
import { Pair } from '../../core/Pair.js'

const plugin: BasePlugin = {
  name: 'retrieve-candles-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('retrieve-candles', {
      name: 'retrieve-candles <pair>',
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
        {
          flags: '-s, --store <name>',
          description: 'Stockage à utiliser',
          defaultValue: app.config.get('plugin.store'),
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
        const storeName = String(context.options.store ?? app.config.get('plugin.store'))

        const exchange = app.exchanges.get(exchangeName)
        const notifier = app.notifiers.get(notifierName)
        const store = app.stores.get(storeName)

        if (!exchange.isPairSupported(pair)) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }

        const candles = await exchange.getCandles(pair, 1) // Récupère les bougies avec un intervalle de 1 minute

        if (candles.length === 0) {
          await notifier.send(
            `Aucune bougie trouvée pour le couple de devises ${pair} sur l'exchange ${exchangeName}.`,
          )
          return
        }

        for (const candle of candles) {
          await store.saveCandle(pair, candle.timestamp, candle)
        }

        await notifier.send(
          `Récupération des bougies pour le couple de devises ${pair} sur l'exchange ${exchangeName} effectuée avec succès. Nombre de bougies récupérées : ${candles.length}.`,
        )
      },
    })
  },
}

export default plugin
