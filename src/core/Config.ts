import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

export class Config {
  private configMap: Record<string, string | undefined> = {
    defaultExchange: 'fake',
    defaultStrategy: 'always-buy',
    defaultNotifier: 'console',
    defaultStore: 'memory',
  }

  constructor() {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      this.configMap['app.name'] = packageJson.name
      this.configMap['app.version'] = packageJson.version
      this.configMap['app.description'] = packageJson.description
    }
  }

  get(key: string): string {
    if (process.env[key] !== undefined) {
      return process.env[key]
    }

    if (this.configMap[key] === undefined) {
      throw new Error(`Config key not found: ${key}`)
    }

    return this.configMap[key]
  }
}
