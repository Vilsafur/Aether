import { describe, expect, it } from 'vitest'
import { Pair } from '../../src/core/Pair.js'

describe('Pair', () => {
  it('should create a pair from a string', () => {
    const pair = Pair.fromString('BTC/EUR')
    expect(pair.getFirstCurrency()).toBe('BTC')
    expect(pair.getSecondCurrency()).toBe('EUR')
  })

  it('should throw an error for invalid pair string', () => {
    expect(() => Pair.fromString('BTC')).toThrow('Invalid pair string: BTC')
  })

  it('should set and get historical name', () => {
    const pair = Pair.fromString('BTC/EUR')
    pair.setHistoricalName('XBTEUR')
    expect(pair.getHistoricalName()).toBe('XBTEUR')
  })

  it('should return undefined if historical name is not set', () => {
    const pair = Pair.fromString('BTC/EUR')
    expect(pair.getHistoricalName()).toEqual(undefined)
  })

  it('should compare pairs correctly', () => {
    const pair1 = Pair.fromString('BTC/EUR')
    const pair2 = Pair.fromString('BTC/EUR')
    const pair3 = Pair.fromString('ETH/EUR')

    expect(pair1.equals(pair2)).toBe(true)
    expect(pair1.equals(pair3)).toBe(false)
  })
})
