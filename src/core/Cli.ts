import { Command } from 'commander'
import type { AppCommand } from '../contracts/Command.js'
import type { AppContext } from './AppContext.js'

export interface CliMetadata {
  name: string
  version: string
  description?: string
}

export class Cli {
  private readonly program = new Command()

  constructor(
    private readonly app: AppContext,
    private readonly metadata: CliMetadata,
  ) {}

  configure(): void {
    this.program
      .name(this.metadata.name)
      .description(this.metadata.description ?? `${this.metadata.name} CLI`)
      .version(this.metadata.version)

    for (const commandName of this.app.commands.list()) {
      this.registerCommand(this.app.commands.get(commandName))
    }
  }

  async run(argv: string[]): Promise<void> {
    await this.program.parseAsync(argv)
  }

  private registerCommand(appCommand: AppCommand): void {
    const command = this.program.command(appCommand.name).description(appCommand.description)

    if (appCommand.argument) {
      command.argument(appCommand.argument)
    }

    for (const option of appCommand.options ?? []) {
      if (option.defaultValue === undefined) {
        command.option(option.flags, option.description)
      } else {
        command.option(option.flags, option.description, option.defaultValue)
      }
    }

    command.action(async (...values: unknown[]) => {
      const commanderCommand = values.at(-1) as Command
      const argsValues = values.slice(0, -2).map(String)

      await appCommand.run({
        args: {
          values: argsValues,
        },
        options: commanderCommand.opts(),
      })
    })
  }
}
