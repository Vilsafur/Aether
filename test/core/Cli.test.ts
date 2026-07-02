import { describe, expect, it, vi } from 'vitest'
import { AppContext } from '../../src/core/AppContext.js'
import { Cli } from '../../src/core/Cli.js'

function createCli(app: AppContext): Cli {
  const cli = new Cli(app, {
    name: 'aether',
    version: '1.0.0',
    description: 'Aether CLI',
  })

  cli.configure()

  return cli
}

describe('Cli', () => {
  it('executes a registered command', async () => {
    const app = new AppContext()
    const run = vi.fn()

    app.commands.register('hello', {
      name: 'hello',
      description: 'Say hello',
      run,
    })

    const cli = createCli(app)

    await cli.run(['node', 'aether', 'hello'])

    expect(run).toHaveBeenCalledWith({
      args: {
        values: [],
      },
      options: {},
    })
  })

  it('passes command arguments to the handler', async () => {
    const app = new AppContext()
    const run = vi.fn()

    app.commands.register('analyze', {
      name: 'analyze',
      description: 'Analyze a symbol',
      argument: '<symbol>',
      run,
    })

    const cli = createCli(app)

    await cli.run(['node', 'aether', 'analyze', 'BTC/USDT'])

    expect(run).toHaveBeenCalledWith({
      args: {
        values: ['BTC/USDT'],
      },
      options: {},
    })
  })

  it('passes command options to the handler', async () => {
    const app = new AppContext()
    const run = vi.fn()

    app.commands.register('analyze', {
      name: 'analyze',
      description: 'Analyze a symbol',
      argument: '<symbol>',
      options: [
        {
          flags: '-e, --exchange <name>',
          description: 'Exchange to use',
          defaultValue: 'fake',
        },
        {
          flags: '-s, --strategy <name>',
          description: 'Strategy to use',
          defaultValue: 'always-buy',
        },
      ],
      run,
    })

    const cli = createCli(app)

    await cli.run([
      'node',
      'aether',
      'analyze',
      'ETH/USDT',
      '--exchange',
      'binance',
      '--strategy',
      'rsi',
    ])

    expect(run).toHaveBeenCalledWith({
      args: {
        values: ['ETH/USDT'],
      },
      options: {
        exchange: 'binance',
        strategy: 'rsi',
      },
    })
  })

  it('uses default option values', async () => {
    const app = new AppContext()
    const run = vi.fn()

    app.commands.register('analyze', {
      name: 'analyze',
      description: 'Analyze a symbol',
      argument: '<symbol>',
      options: [
        {
          flags: '-e, --exchange <name>',
          description: 'Exchange to use',
          defaultValue: 'fake',
        },
      ],
      run,
    })

    const cli = createCli(app)

    await cli.run(['node', 'aether', 'analyze', 'BTC/USDT'])

    expect(run).toHaveBeenCalledWith({
      args: {
        values: ['BTC/USDT'],
      },
      options: {
        exchange: 'fake',
      },
    })
  })

  it('supports boolean options without default value', async () => {
    const app = new AppContext()
    const run = vi.fn()

    app.commands.register('debug', {
      name: 'debug',
      description: 'Debug command',
      options: [
        {
          flags: '-v, --verbose',
          description: 'Enable verbose mode',
        },
      ],
      run,
    })

    const cli = createCli(app)

    await cli.run(['node', 'aether', 'debug', '--verbose'])

    expect(run).toHaveBeenCalledWith({
      args: {
        values: [],
      },
      options: {
        verbose: true,
      },
    })
  })

  it('supports async command handlers', async () => {
    const app = new AppContext()
    const run = vi.fn(async () => {
      await Promise.resolve()
    })

    app.commands.register('async-command', {
      name: 'async-command',
      description: 'Async command',
      run,
    })

    const cli = createCli(app)

    await cli.run(['node', 'aether', 'async-command'])

    expect(run).toHaveBeenCalledOnce()
  })
})
