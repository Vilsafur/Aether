export type StrategyAction = "buy" | "sell" | "hold";

export interface StrategyContext {
  symbol: string;
  price: number;
}

export interface StrategyDecision {
  action: StrategyAction;
  confidence: number;
  reason: string;
}

export interface Strategy {
  analyze(context: StrategyContext): Promise<StrategyDecision>;
}