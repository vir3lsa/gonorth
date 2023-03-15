import { ActionChain } from "./actionChain";

const WILDCARD = "__effects:wildcard__";

function getKey(item: MaybeItemOrString): string {
  if (!item) {
    return "__undefined__";
  }

  return typeof item === "string" ? item : item.name;
}

/**
 * Class that can be used to store the effects of interactions between pairs of items.
 */
export class Effects {
  effects: EffectsDict;

  constructor() {
    this.effects = {};
  }

  add(
    primary: ItemOrString,
    secondary: ItemOrString,
    verbName: string,
    successful: boolean,
    continueVerb: boolean,
    ...effects: ContextAction[]
  ) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);
    const affectedItems = this.effects[primaryKey] || {};
    this.effects[primaryKey] = affectedItems;

    const affectedPair = affectedItems[secondaryKey] || {};
    affectedItems[secondaryKey] = affectedPair;

    affectedPair[verbName] = {
      successful,
      continueVerb,
      effects: new ActionChain(...(effects as Action[]))
    };
  }

  addWildcard(
    secondary: ItemOrString,
    verbName: string,
    successful: boolean,
    continueVerb: boolean,
    ...effects: ContextAction[]
  ) {
    this.add(WILDCARD, secondary, verbName, successful, continueVerb, ...effects);
  }

  hasEffect(primary: ItemOrString, secondary: ItemOrString, verbName: string) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.effects ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.effects
    );
  }

  isSuccessful(primary: ItemOrString, secondary: ItemOrString, verbName: string) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.successful ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.successful
    );
  }

  apply(primary: ItemOrString, secondary: ItemOrString, verbName: string) {
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

  getEffect(primary: MaybeItemOrString, secondary: MaybeItemOrString, verbName: string) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return this.effects[primaryKey]?.[secondaryKey]?.[verbName] || this.effects[WILDCARD]?.[secondaryKey]?.[verbName];
  }
}
