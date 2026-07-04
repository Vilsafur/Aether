import { describe, expect, it } from 'vitest'
import { AppContext } from '../../../src/core/AppContext.js'
import { Pair } from '../../../src/core/Pair.js'
import fakeExchangePlugin from '../../../src/plugins/exchanges/fake-exchange.js'

describe('fake exchange plugin', () => {
  it('should register the fake exchange', () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    expect(app.exchanges.list()).toEqual(['fake'])

    const store = app.exchanges.get('fake')

    expect(store).toBeDefined()
  })

  it('should retrieve the price for a supported pair', async () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    const exchange = app.exchanges.get('fake')

    expect(exchange).toBeDefined()

    const price = await exchange.getPrice(new Pair('BTC', 'EUR'))
    expect(price).toBe(42_000)
  })

  it('should retrieve the candles for a supported pair', async () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    const exchange = app.exchanges.get('fake')

    expect(exchange).toBeDefined()

    const candles = await exchange.getCandles(new Pair('BTC', 'EUR'))
    expect(candles.length).toBe(2)
  })

  it('should retrieve the historical name for a supported pair', async () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    const exchange = app.exchanges.get('fake')

    expect(exchange).toBeDefined()

    const historicalName = await exchange.getPairHistoricalName(new Pair('BTC', 'EUR'))
    expect(historicalName).toBe('XBTEUR')
  })

  it('should throw an error for an unsupported pair when retrieving historical name', async () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    const exchange = app.exchanges.get('fake')

    expect(exchange).toBeDefined()

    await expect(exchange.getPairHistoricalName(new Pair('ETH', 'EUR'))).rejects.toThrow()
  })

  it('should check if a pair is supported', async () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    const exchange = app.exchanges.get('fake')

    expect(exchange).toBeDefined()

    const isSupportedBTC = await exchange.isPairSupported(new Pair('BTC', 'EUR'))
    expect(isSupportedBTC).toBe(true)

    const isSupportedETH = await exchange.isPairSupported(new Pair('ETH', 'EUR'))
    expect(isSupportedETH).toBe(true)

    const isSupportedLTC = await exchange.isPairSupported(new Pair('LTC', 'EUR'))
    expect(isSupportedLTC).toBe(false)
  })

  it('should retrieve the list of supported pairs', async () => {
    const app = new AppContext()

    fakeExchangePlugin.setup(app)

    const exchange = app.exchanges.get('fake')

    expect(exchange).toBeDefined()

    const supportedPairs = await exchange.getSupportedPairs()
    expect(supportedPairs.map((pair) => pair.toString())).toEqual(['BTC/EUR', 'ETH/EUR'])
  })
})
