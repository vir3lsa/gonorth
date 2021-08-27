import { RandomText } from "../../lib/game/interactions/text";
import { ActionChain } from "./actionChain";

/**
 * Class that can be used to store the effects of interactions between pairs of items.
 */
export class Effects {
  constructor(defaultFailure) {
    this.defaultFailure =
      defaultFailure ||
      (() =>
        new RandomText(
          "Nothing happens.",
          "That doesn't seem to work.",
          "Well, that was pointless."
        ));
    this.effects = {};
  }

  add(primary, secondary, successful, ...effects) {
    const affectedItems = this.effects[primary.name] || {};
    this.effects[primary.name] = affectedItems;

    affectedItems[secondary.name] = {
      successful,
      effects: new ActionChain(...effects),
    };
  }

  hasEffect(primary, secondary) {
    return (
      this.effects[primary.name] &&
      this.effects[primary.name][secondary.name] &&
      this.effects[primary.name][secondary.name].effects
    );
  }

  isSuccessful(primary, secondary) {
    return (
      this.effects[primary.name] &&
      this.effects[primary.name][secondary.name] &&
      this.effects[primary.name][secondary.name].successful
    );
  }

  apply(primary, secondary) {
    if (this.hasEffect(primary, secondary)) {
      const effects = this.effects[primary.name][secondary.name].effects;

      if (effects) {
        return effects;
      }
    }

    return this.defaultFailure(primary, secondary);
  }
}
