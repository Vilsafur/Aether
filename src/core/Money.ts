class MoneyError extends Error {
  constructor(message: string) {
    super(message) // Call the constructor of the base class `Error`
    this.name = 'MoneyError' // Set the error name to your custom error class name
    // Set the prototype explicitly to maintain the correct prototype chain
    Object.setPrototypeOf(this, MoneyError.prototype)
  }
}

export class Money {
  private readonly atomic: number
  private readonly currency: string
  private readonly atomicUnitFactor: number

  constructor(atomic: number, currency: string, atomicUnitFactor: number = 100) {
    this.atomic = atomic
    this.currency = currency
    this.atomicUnitFactor = atomicUnitFactor
  }

  static fromAtomic(atomic: number, currency: string, atomicUnitFactor: number = 100): Money {
    return new Money(atomic, currency, atomicUnitFactor)
  }

  getAtomic(): number {
    return this.atomic
  }

  getCurrency(): string {
    return this.currency
  }

  isZero(): boolean {
    return this.atomic === 0
  }

  isPositive(): boolean {
    return this.atomic > 0
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Cannot add Money with different currencies: ${this.currency} and ${other.currency}`,
      )
    }
    return new Money(this.atomic + other.atomic, this.currency, this.atomicUnitFactor)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Cannot subtract Money with different currencies: ${this.currency} and ${other.currency}`,
      )
    }
    return new Money(this.atomic - other.atomic, this.currency, this.atomicUnitFactor)
  }

  greaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Cannot compare Money with different currencies: ${this.currency} and ${other.currency}`,
      )
    }
    return this.atomic > other.atomic
  }

  lessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Cannot compare Money with different currencies: ${this.currency} and ${other.currency}`,
      )
    }
    return this.atomic < other.atomic
  }

  equals(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Cannot compare Money with different currencies: ${this.currency} and ${other.currency}`,
      )
    }
    return this.atomic === other.atomic && this.currency === other.currency
  }

  toString(): string {
    const atomic = (this.atomic % this.atomicUnitFactor).toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: true,
    })
    const unit = Math.floor(this.atomic / this.atomicUnitFactor).toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: true,
    })
    return `${unit}.${atomic} ${this.currency}`
  }
}
