import { Money } from "./Money.js";
import { Order, Side } from "./Order.js";

export class Trade {
  constructor(
    readonly tradeID: number,
    readonly order: Order,
    readonly price: Money,
    readonly quantity: number,
    readonly fee: Money,
    readonly date: number,
  ) {}

  getSide(): Side {
    return this.order.side
  }

  getTotalPrice(): number {
    return this.fee.getAtomic() + this.price.getAtomic()
  }

  toString(): string {
    return `#${this.tradeID}: ${this.order.side} ${this.order.pair.toString()} (quantity: ${this.quantity}, price: ${this.price.toString()}, fee: ${this.fee.toString()}) `
  }
}
