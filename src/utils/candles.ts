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
): Promise<void> => {
  const intervalInMinutes = getIntervalInMin(interval)
  const intervalInMilliseconds = intervalInMinutes * 60_000

  const candles = await exchange.getCandles(pair, intervalInMinutes)

  if (candles.length === 0) {
    await notifier.send(
      `Aucune bougie trouvée pour le couple de devises ${pair} sur l'exchange ${exchangeName}.`,
    )
    return
  }

  const now = Date.now()

  const closedCandles = candles.filter((candle) => {
    const candleClosingTimestamp =
      candle.timestamp + intervalInMilliseconds

    return candleClosingTimestamp <= now
  })

  if (closedCandles.length === 0) {
    await notifier.send(
      `Aucune bougie clôturée trouvée pour le couple de devises ${pair} sur l'exchange ${exchangeName} avec l'interval ${interval}.`,
    )
    return
  }

  for (const candle of closedCandles) {
    await store.saveCandle(
      exchangeName,
      pair,
      candle.timestamp,
      interval,
      candle,
    )
  }

  const ignoredCandlesCount =
    candles.length - closedCandles.length

  await notifier.send(
    `Récupération des bougies pour le couple de devises ${pair} sur l'exchange ${exchangeName} avec l'interval ${interval} effectuée avec succès. Bougies reçues : ${candles.length}, bougies clôturées enregistrées : ${closedCandles.length}, bougies ouvertes ignorées : ${ignoredCandlesCount}.`,
  )
}
