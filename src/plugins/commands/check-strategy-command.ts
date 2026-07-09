import type { BasePlugin } from '../../contracts/BasePlugin.js'
import type { Exchange, Interval } from '../../contracts/Exchange.js'
import type { Notifier } from '../../contracts/Notifier.js'
import type { Store } from '../../contracts/Store.js'
import { Pair } from '../../core/Pair.js'
import { getIntervalInMin } from '../../utils/kraken-client.js'

const retrieveCandles = async (
  exchange: Exchange,
  notifier: Notifier,
  store: Store,
  pair: Pair,
  interval: Interval,
  exchangeName: string,
) => {
  const candles = await exchange.getCandles(pair, getIntervalInMin(interval)) // Récupère les bougies avec un intervalle de 1 minute

  if (candles.length === 0) {
    await notifier.send(
      `Aucune bougie trouvée pour le couple de devises ${pair} sur l'exchange ${exchangeName}.`,
    )
    return
  }

  for (const candle of candles) {
    await store.saveCandle(exchangeName, pair, candle.timestamp, interval, candle)
  }

  await notifier.send(
    `Récupération des bougies pour le couple de devises ${pair} sur l'exchange ${exchangeName} avec l'interval ${interval} effectuée avec succès. Nombre de bougies récupérées : ${candles.length}.`,
  )
}

const plugin: BasePlugin = {
  name: 'check-strategy-command',
  type: 'scheduler',
  version: '1.0.0',

  setup(app) {
    app.commands.register('check-strategy', {
      name: 'check-strategy <pair>',
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
        {
          flags: '-u, --strategy <name>',
          description: 'Stratégie à utiliser',
          defaultValue: app.config.get('plugin.strategy'),
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
        const strategyName = String(context.options.strategy ?? app.config.get('plugin.strategy'))

        const exchange = app.exchanges.get(exchangeName)
        const notifier = app.notifiers.get(notifierName)
        const store = app.stores.get(storeName)
        const strategy = app.strategies.get(strategyName)

        if (!exchange.isPairSupported(pair)) {
          throw new Error(
            `Le couple de devises ${pair} n'est pas supporté par l'exchange ${exchangeName}.`,
          )
        }
        await retrieveCandles(exchange, notifier, store, pair, '1d', exchangeName)
        await retrieveCandles(exchange, notifier, store, pair, '4h', exchangeName)
        await retrieveCandles(exchange, notifier, store, pair, '1h', exchangeName)

        strategy.analyze({
          pair,
        })
      },
    })
  },
}

export default plugin
