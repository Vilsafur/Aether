import { Money } from "./Money.js"
import { Trade } from "./Trade.js"

interface Cashback {
  [currency: string]: Money
}

export class Portfolio {

  constructor(private cashBack: Cashback) {}

  getMoneyByCurrency(currency: string): Money | undefined {
    return this.cashBack[currency]
  }

  addMoney(newMoney: Money) {
    const current = this.cashBack[newMoney.getCurrency()]
    if (current) {
      current.add(newMoney)
      return
    }

    this.cashBack[newMoney.getCurrency()] = newMoney
  }

  canBuy(amount: Money): boolean {
    const current = this.cashBack[amount.getCurrency()]
    if (current === undefined) {
      return false
    }

    return current.greaterThan(amount) || current.equals(amount)
  }

  canSell(amount: Money): boolean {
    const current = this.cashBack[amount.getCurrency()]
    if (current === undefined) {
      return false
    }

    return current.greaterThan(amount) || current.equals(amount)
  }

  applyTrade(trade: Trade) {
    switch (trade.order.side) {
      case 'buy':
        this.applyBuyTrade(trade)
        break;
        case 'sell':
        this.applySellTrade(trade)
        break;
    }
  }

  applyBuyTrade(trade: Trade) {
    const pair = trade.order.pair
    // Currency achetée
    const currencyBuy = this.cashBack[pair.getFirstCurrency()]
    // Currency utilisée
    const currencyUsed = this.cashBack[pair.getSecondCurrency()]

    if (currencyUsed === undefined || currencyUsed.isZero() || currencyUsed.lessThan(trade.order.amount)) {
      throw new Error(`Impossible d'acheter avec du ${pair.getSecondCurrency()}: rien dans le portefeuille`)
    }

    if (currencyBuy === undefined) {
      this.cashBack[pair.getFirstCurrency()] = Money.fromAtomic(trade.quantity, pair.getFirstCurrency())
      return
    }

    currencyBuy.add(
      new Money(
        trade.quantity,
        pair.getFirstCurrency()
      )
    )
  }

  applySellTrade(trade: Trade) {
    const pair = trade.order.pair
    // Currency achetée
    const currencyUsed = this.cashBack[pair.getFirstCurrency()]
    // Currency utilisée
    const currencyBuy = this.cashBack[pair.getSecondCurrency()]

    if (currencyUsed === undefined || currencyUsed.isZero() || currencyUsed.lessThan(trade.order.amount)) {
      throw new Error(`Impossible d'acheter avec du ${pair.getFirstCurrency()}: rien dans le portefeuille`)
    }

    if (currencyBuy === undefined) {
      this.cashBack[pair.getSecondCurrency()] = Money.fromAtomic(trade.quantity, pair.getSecondCurrency())
      return
    }

    currencyBuy.add(
      new Money(
        trade.quantity,
        pair.getSecondCurrency()
      )
    )
  }
}
