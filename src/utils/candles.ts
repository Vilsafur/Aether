import { Exchange, Interval } from "../contracts/Exchange.js"
import { Notifier } from "../contracts/Notifier.js"
import { Store } from "../contracts/Store.js"
import { Pair } from "../core/Pair.js"
import { getIntervalInMin } from "./kraken-client.js"


export const retrieveCandles = async (
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