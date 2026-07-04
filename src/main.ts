import packageJson from '../package.json' with { type: 'json' }
import { AppContext } from './core/AppContext.js'
import { Cli } from './core/Cli.js'
import { PluginManager } from './core/PluginManager.js'
import analyzeCommandPlugin from './plugins/commands/analyze-command.js'
import retrieveCandleCommandPlugin from './plugins/commands/retrieve-candles-command.js'
import fakeExchangePlugin from './plugins/exchanges/fake-exchange.js'
import consoleNotifierPlugin from './plugins/notifiers/console-notifier.js'
import memoryStoragePlugin from './plugins/store/memory.js'
import alwaysBuyPlugin from './plugins/strategies/always-buy.js'

const app = new AppContext()
const pluginManager = new PluginManager(app)

await pluginManager.load(fakeExchangePlugin)
await pluginManager.load(alwaysBuyPlugin)
await pluginManager.load(consoleNotifierPlugin)
await pluginManager.load(memoryStoragePlugin)
await pluginManager.load(analyzeCommandPlugin)
await pluginManager.load(retrieveCandleCommandPlugin)

await pluginManager.startAll()

const cli = new Cli(app, {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
})
cli.configure()

await cli.run(process.argv)

await pluginManager.stopAll()
