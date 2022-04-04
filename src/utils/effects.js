import { RandomText } from "../../lib/game/interactions/text";
import { ActionChain } from "./actionChain";

function getKey(item) {
  return typeof item === "string" ? item : item.name;
}

/**
 * Class that can be used to store the effects of interactions between pairs of items.
 */
export class Effects {
  constructor(defaultFailure) {
    this.defaultFailure =
      defaultFailure ||
      (() => new RandomText("Nothing happens.", "That doesn't seem to work.", "Well, that was pointless."));
    this.effects = {};
  }

  add(primary, secondary, successful, ...effects) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);
    const affectedItems = this.effects[primaryKey] || {};
    this.effects[primaryKey] = affectedItems;

    affectedItems[secondaryKey] = {
      successful,
      effects: new ActionChain(...effects)
    };
  }

  hasEffect(primary, secondary) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey] &&
        this.effects[primaryKey][secondaryKey] &&
        this.effects[primaryKey][secondaryKey].effects
    );
  }

  isSuccessful(primary, secondary) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey] &&
        this.effects[primaryKey][secondaryKey] &&
        this.effects[primaryKey][secondaryKey].successful
    );
  }

  apply(primary, secondary) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    if (this.hasEffect(primary, secondary)) {
      const effects = this.effects[primaryKey][secondaryKey].effects;

      if (effects) {
        return effects;
      }
    }

    return this.defaultFailure(primary, secondary);
  }
}

/*
 * Effects referring to a fixed subject.
 */
export class FixedSubjectEffects extends Effects {
  constructor(subject, defaultFailure) {
    super(defaultFailure);
    this.subject = subject;
  }

  add(primary, successful, ...effects) {
    return super.add(primary, this.subject, successful, ...effects);
  }

  hasEffect(primary) {
    return super.hasEffect(primary, this.subject);
  }

  isSuccessful(primary) {
    return super.isSuccessful(primary, this.subject);
  }

  apply(primary) {
    return super.apply(primary, this.subject);
  }
}
