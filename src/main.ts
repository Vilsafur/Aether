import { AppContext } from './core/AppContext.js'
import { PluginManager } from './core/PluginManager.js'

import fakeExchangePlugin from './plugins/exchanges/fake-exchange.js'
import consoleNotifierPlugin from './plugins/notifiers/console-notifier.js'
import alwaysBuyPlugin from './plugins/strategies/always-buy.js'

const app = new AppContext()
const pluginManager = new PluginManager(app)

await pluginManager.load(fakeExchangePlugin)
await pluginManager.load(alwaysBuyPlugin)
await pluginManager.load(consoleNotifierPlugin)

await pluginManager.startAll()

const exchange = app.exchanges.get('fake')
const strategy = app.strategies.get('always-buy')
const notifier = app.notifiers.get('console')

const symbol = 'BTC/USDT'
const price = await exchange.getPrice(symbol)

const decision = await strategy.analyze({
  symbol,
  price,
})

await notifier.send(
  `Décision pour ${symbol} : ${decision.action.toUpperCase()} - ${decision.reason}`,
)

await pluginManager.stopAll()
