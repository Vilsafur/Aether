import { describe, expect, it } from 'vitest'
import { Config } from '../../src/core/Config.js'

describe('Config', () => {
  it('should load the config file', () => {
    const config = new Config()

    expect(config).toBeDefined()
    expect(config.get('app.name')).toBe('aether')
  })
})
