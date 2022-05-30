import { ActionChain } from "./actionChain";

const WILDCARD = "__effects:wildcard__";

function getKey(item) {
  return typeof item === "string" ? item : item.name;
}

/**
 * Class that can be used to store the effects of interactions between pairs of items.
 */
export class Effects {
  constructor() {
    this.effects = {};
  }

  add(primary, secondary, verbName, successful, ...effects) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);
    const affectedItems = this.effects[primaryKey] || {};
    this.effects[primaryKey] = affectedItems;

    const affectedPair = affectedItems[secondaryKey] || {};
    affectedItems[secondaryKey] = affectedPair;

    affectedPair[verbName] = {
      successful,
      effects: new ActionChain(...effects)
    };
  }

  addWildcard(secondary, verbName, successful, ...effects) {
    this.add(WILDCARD, secondary, verbName, successful, ...effects);
  }

  hasEffect(primary, secondary, verbName) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.effects ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.effects
    );
  }

  isSuccessful(primary, secondary, verbName) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.successful ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.successful
    );
  }

  apply(primary, secondary, verbName) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    if (this.hasEffect(primary, secondary, verbName)) {
      const effects =
        this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.effects ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.effects;

      if (effects) {
        return effects;
      }
    }
  }
}
