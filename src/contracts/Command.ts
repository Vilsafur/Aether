export interface CommandContext {
  args: {
    values: string[]
  }
  options: Record<string, string | boolean | string[] | undefined>
}

export interface AppCommand {
  name: string
  description: string
  argument?: string
  options?: CommandOption[]

  run(context: CommandContext): Promise<void> | void
}

export interface CommandOption {
  flags: string
  description: string
  defaultValue?: string | boolean | string[]
}
