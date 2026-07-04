import type { Pair } from '../core/Pair.js'

export type StrategyAction = 'buy' | 'sell' | 'hold'

export interface StrategyContext {
  pair: Pair
  price: number
}

export interface StrategyDecision {
  action: StrategyAction
  confidence: number
  reason: string
}

export interface Strategy {
  analyze(context: StrategyContext): Promise<StrategyDecision>
}
