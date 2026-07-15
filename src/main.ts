import { AppContext } from './core/AppContext.js'
import { Cli } from './core/Cli.js'
import { PluginManager } from './core/PluginManager.js'
import analyzeCommandPlugin from './plugins/commands/analyze-command.js'
import checkStrategyCommandPlugin from './plugins/commands/check-strategy-command.js'
import retrieveCandleCommandPlugin from './plugins/commands/retrieve-candles-command.js'
import retrieveFeeCommandPlugin from './plugins/commands/retrieve-fees-command.js'
import botCommandPlugin from './plugins/commands/bot-command.js'
import fakeExchangePlugin from './plugins/exchanges/fake-exchange.js'
import krakenExchangePlugin from './plugins/exchanges/kraken-exchange.js'
import consoleNotifierPlugin from './plugins/notifiers/console-notifier.js'
import memoryStorePlugin from './plugins/store/memory-store.js'
import sqliteStorePlugin from './plugins/store/sqlite-store.js'
import alwaysBuyPlugin from './plugins/strategies/always-buy.js'
import trendFollowingPlugin from './plugins/strategies/trend-following.js'

const app = new AppContext()
const pluginManager = new PluginManager(app, {
  single: {
    store: app.config.get('plugin.store'),
    exchange: app.config.get('plugin.exchange'),
    notifier: app.config.get('plugin.notifier'),
  },
  enabled: [
    'strategy:always-buy',
    'strategy:trend-following',
    'scheduler:analyze-command',
    'scheduler:retrieve-candles-command',
    'scheduler:retrieve-fees-command',
    'scheduler:check-strategy-command',
    'scheduler:bot-command',
  ],
})

await pluginManager.load(fakeExchangePlugin)
await pluginManager.load(krakenExchangePlugin)
await pluginManager.load(consoleNotifierPlugin)
await pluginManager.load(memoryStorePlugin)
await pluginManager.load(sqliteStorePlugin)
await pluginManager.load(analyzeCommandPlugin)
await pluginManager.load(retrieveCandleCommandPlugin)
await pluginManager.load(retrieveFeeCommandPlugin)
await pluginManager.load(checkStrategyCommandPlugin)
await pluginManager.load(botCommandPlugin)
await pluginManager.load(alwaysBuyPlugin)
await pluginManager.load(trendFollowingPlugin)

await pluginManager.startAll()

const cli = new Cli(app, {
  name: app.config.get('app.name'),
  version: app.config.get('app.version'),
  description: app.config.get('app.description'),
})
cli.configure()

await cli.run(process.argv)

await pluginManager.stopAll()
