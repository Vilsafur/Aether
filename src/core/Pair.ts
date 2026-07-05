export class Pair {
  private readonly firstCurrency: string
  private readonly secondCurrency: string
  private historicalName: string | undefined

  constructor(firstCurrency: string, secondCurrency: string, historicalName?: string) {
    this.firstCurrency = firstCurrency
    this.secondCurrency = secondCurrency
    this.historicalName = historicalName
  }

  static fromString(pairString: string): Pair {
    const [firstCurrency, secondCurrency] = pairString.split('/')
    if (!firstCurrency || !secondCurrency) {
      throw new Error(`Invalid pair string: ${pairString}`)
    }
    return new Pair(firstCurrency, secondCurrency)
  }

  getFirstCurrency(): string {
    return this.firstCurrency
  }

  getSecondCurrency(): string {
    return this.secondCurrency
  }

  setHistoricalName(historicalName: string): void {
    this.historicalName = historicalName
  }

  getHistoricalName(): string | undefined {
    return this.historicalName
  }

  equals(other: Pair): boolean {
    return (
      this.firstCurrency === other.firstCurrency && this.secondCurrency === other.secondCurrency
    )
  }

  toString(): string {
    return `${this.firstCurrency}/${this.secondCurrency}`
  }
}
