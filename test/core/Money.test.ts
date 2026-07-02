import { describe, expect, it } from 'vitest'
import { Money } from '../../src/core/Money.js'

describe('Money', () => {
  it('should create a Money instance', () => {
    const money = new Money(100, 'USD')
    expect(money.getAtomic()).toBe(100)
    expect(money.getCurrency()).toBe('USD')
  })

  it('should add two Money instances with the same currency', () => {
    const money1 = new Money(100, 'USD')
    const money2 = new Money(50, 'USD')
    const result = money1.add(money2)
    expect(result.getAtomic()).toBe(150)
    expect(result.getCurrency()).toBe('USD')
  })

  it('should throw an error when adding Money instances with different currencies', () => {
    const money1 = new Money(100, 'USD')
    const money2 = new Money(50, 'EUR')
    expect(() => money1.add(money2)).toThrow(
      'Cannot add Money with different currencies: USD and EUR',
    )
  })

  it('should subtract two Money instances with the same currency', () => {
    const money1 = new Money(100, 'USD')
    const money2 = new Money(50, 'USD')
    const result = money1.subtract(money2)
    expect(result.getAtomic()).toBe(50)
    expect(result.getCurrency()).toBe('USD')
  })

  it('should throw an error when subtracting Money instances with different currencies', () => {
    const money1 = new Money(100, 'USD')
    const money2 = new Money(50, 'EUR')
    expect(() => money1.subtract(money2)).toThrow(
      'Cannot subtract Money with different currencies: USD and EUR',
    )
  })

  it('should compare two Money instances with the same currency', () => {
    const money1 = new Money(100, 'USD')
    const money2 = new Money(50, 'USD')
    expect(money1.greaterThan(money2)).toBe(true)
    expect(money1.lessThan(money2)).toBe(false)
    expect(money1.equals(money2)).toBe(false)
  })

  it('should throw an error when comparing Money instances with different currencies', () => {
    const money1 = new Money(100, 'USD')
    const money2 = new Money(50, 'EUR')
    expect(() => money1.greaterThan(money2)).toThrow(
      'Cannot compare Money with different currencies: USD and EUR',
    )
    expect(() => money1.lessThan(money2)).toThrow(
      'Cannot compare Money with different currencies: USD and EUR',
    )
    expect(() => money1.equals(money2)).toThrow(
      'Cannot compare Money with different currencies: USD and EUR',
    )
  })

  it('should return a string representation of Money', () => {
    const money = new Money(12345, 'USD')
    expect(money.toString()).toBe('123.45 USD')
  })

  it('should correctly identify zero and positive Money', () => {
    const zeroMoney = new Money(0, 'USD')
    const positiveMoney = new Money(100, 'USD')
    expect(zeroMoney.isZero()).toBe(true)
    expect(zeroMoney.isPositive()).toBe(false)
    expect(positiveMoney.isZero()).toBe(false)
    expect(positiveMoney.isPositive()).toBe(true)
  })
})
