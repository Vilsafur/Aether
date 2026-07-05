import { describe, expect, it } from 'vitest'
import type { Candle } from '../../../src/contracts/Exchange.js'
import { AppContext } from '../../../src/core/AppContext.js'
import { Pair } from '../../../src/core/Pair.js'
import memoryPlugin from '../../../src/plugins/store/memory-store.js'

describe('memory store plugin', () => {
  it('registers the memory store', () => {
    const app = new AppContext()

    memoryPlugin.setup(app)

    expect(app.stores.list()).toEqual(['memory'])

    const store = app.stores.get('memory')

    expect(store).toBeDefined()
  })

  it('save one candle', async () => {
    const app = new AppContext()

    memoryPlugin.setup(app)

    const store = app.stores.get('memory')

    expect(store).toBeDefined()

    const pair: Pair = new Pair('BTC', 'EUR')
    const timestamp = Date.now()
    const candle: Candle = {
      timestamp,
      open: 40000,
      high: 41000,
      low: 39000,
      close: 40500,
      volume: 100,
      vwap: 40250,
    }

    await store.saveCandle(pair, timestamp, candle)

    // Verify that the candle was saved correctly
    expect(await store.getCandles(pair)).toEqual([candle])
  })
})
