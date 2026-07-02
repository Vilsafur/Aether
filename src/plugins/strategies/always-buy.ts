import type { BasePlugin } from "../../contracts/BasePlugin.js";
import type {
  Strategy,
  StrategyContext,
  StrategyDecision
} from "../../contracts/Strategy.js";

class AlwaysBuyStrategy implements Strategy {
  async analyze(context: StrategyContext): Promise<StrategyDecision> {
    return {
      action: "buy",
      confidence: 0.75,
      reason: `Stratégie de test : achat systématique sur ${context.symbol} à ${context.price}`
    };
  }
}

const plugin: BasePlugin = {
  name: "always-buy",
  type: "strategy",
  version: "1.0.0",

  setup(app) {
    app.strategies.register("always-buy", new AlwaysBuyStrategy());
  }
};

export default plugin;