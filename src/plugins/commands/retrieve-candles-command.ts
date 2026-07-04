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
          defaultValue: 'fake',
        },
        {
          flags: '-n, --notifier <name>',
          description: 'Notifier à utiliser',
          defaultValue: 'console',
        },
        {
          flags: '-s, --storage <name>',
          description: 'Stockage à utiliser',
          defaultValue: 'memory',
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

        const exchangeName = String(context.options.exchange ?? 'fake')
        const notifierName = String(context.options.notifier ?? 'console')
        const storageName = String(context.options.storage ?? 'memory')

        const exchange = app.exchanges.get(exchangeName)
        const notifier = app.notifiers.get(notifierName)
        const storage = app.stores.get(storageName)

        if (!exchange.isPairSupported(pair)) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }

        const candles = await exchange.getCandles(pair)

        if (candles.length === 0) {
          await notifier.send(
            `Aucune bougie trouvée pour le couple de devises ${pair} sur l'exchange ${exchangeName}.`,
          )
          return
        }

        for (const candle of candles) {
          await storage.saveCandle(pair, candle.timestamp, candle)
        }

        await notifier.send(
          `Récupération des bougies pour le couple de devises ${pair} sur l'exchange ${exchangeName} effectuée avec succès. Nombre de bougies récupérées : ${candles.length}.`,
        )
      },
    })
  },
}

export default plugin
