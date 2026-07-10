import { Money } from "./Money.js";
import { Pair } from "./Pair.js";

export type Side = 'buy' | 'sell'

export class Order {

  constructor(
    readonly id: number,
    readonly pair: Pair,
    readonly side: Side,
    readonly amount: Money
  ) {}

  static newOrderBuy(id: number, pair: Pair, amount: Money): Order {
    if (!amount.isPositive()) {
      throw new Error(`La quantité de money doit être plus grande de 0: ${amount.getAtomic()}`)
    }

    return new Order(
      id,
      pair,
      'buy',
      amount
    )
  }

  static newOrderSell(id: number, pair: Pair, amount: Money): Order {
    if (!amount.isPositive()) {
      throw new Error(`La quantité de money doit être plus grande de 0: ${amount.getAtomic()}`)
    }

    return new Order(
      id,
      pair,
      'sell',
      amount
    )
  }

  toString(): string {
    return `${this.side} ${this.pair.toString()} for ${this.amount.toString()}`
  }
}
