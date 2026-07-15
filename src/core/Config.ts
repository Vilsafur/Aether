import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

export class Config {
  private readonly configMap: Record<string, string | undefined> = {
    'plugin.exchange': 'fake',
    'plugin.notifier': 'console',
    'plugin.strategy': 'trend-following',
    'plugin.store': 'memory',
    'sqlite.path': './.data/db.sqlite3',
    'kraken.baseUrl': 'https://api.kraken.com',
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
    const envKey = key.toUpperCase().replace(/\./g, '_')
    if (process.env[envKey] !== undefined) {
      return process.env[envKey]
    }

    if (this.configMap[key] === undefined) {
      throw new Error(`Config key not found: ${key}`)
    }

    return this.configMap[key]
  }
}
