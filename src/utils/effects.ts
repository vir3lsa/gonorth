import { ActionChain } from "./actionChain";

const WILDCARD = "__effects:wildcard__";

export enum VerbRelation {
  Before,
  Instead,
  After,
}

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

  add(effectOrBuilder: Effect | EffectBuilder) {
    const effect = effectOrBuilder instanceof EffectBuilder ? effectOrBuilder.build() : effectOrBuilder;
    const primaryKey = getKey(effect.primaryItem);
    const secondaryKey = getKey(effect.secondaryItem);
    const affectedItems = this.effects[primaryKey] || {};
    this.effects[primaryKey] = affectedItems;

    const affectedPair = affectedItems[secondaryKey] || {};
    affectedItems[secondaryKey] = affectedPair;

    affectedPair[effect.verbName] = effect;
  }

  hasEffect(primary: ItemOrString, secondary: ItemOrString, verbName: string) {
    const primaryKey = getKey(primary);
    const secondaryKey = getKey(secondary);

    return Boolean(
      this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.actionChain ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.actionChain
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
        this.effects[primaryKey]?.[secondaryKey]?.[verbName]?.actionChain ||
        this.effects[WILDCARD]?.[secondaryKey]?.[verbName]?.actionChain;

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

export class Effect {
  primaryItem?: ItemOrString;
  secondaryItem: ItemOrString;
  verbName: string;
  successful: boolean;
  verbRelation: VerbRelation;
  actionChain: ActionChain;

  constructor(builder: EffectBuilder) {
    this.primaryItem = builder.config.primaryItem;
    this.secondaryItem = builder.config.secondaryItem!;
    this.verbName = builder.config.verbName!;
    this.successful = builder.config.successful ?? true;
    this.verbRelation = builder.config.verbRelation ?? VerbRelation.Before;
    this.actionChain = new ActionChain(...(builder.config.actions! as Action[]));
  }

  static get Builder() {
    return EffectBuilder;
  }
}

export class EffectBuilder {
  config: Partial<EffectConfig> = {
    actions: [],
  };

  withPrimaryItem(primaryItem: ItemOrString) {
    this.config.primaryItem = primaryItem;
    return this;
  }

  withAnyPrimaryItem() {
    this.config.primaryItem = WILDCARD;
    return this;
  }

  withSecondaryItem(secondaryItem: ItemOrString) {
    this.config.secondaryItem = secondaryItem;
    return this;
  }

  withVerbName(verbName: string) {
    this.config.verbName = verbName;
    return this;
  }

  isSuccessful(successful = true) {
    this.config.successful = successful;
    return this;
  }

  withVerbRelation(verbRelation: VerbRelation) {
    this.config.verbRelation = verbRelation;
    return this;
  }

  withActions(...actions: ContextAction[]) {
    this.config.actions!.push(...actions);
    return this;
  }

  build() {
    if (!this.config.secondaryItem) {
      throw Error("Tried to build an Effect but secondaryItem is not set.");
    }

    if (!this.config.verbName) {
      throw Error("Tried to build an Effect but verbName is not set.");
    }

    if (!this.config.actions) {
      throw Error("Tried to build an Effect but actions is not set.");
    }

    return new Effect(this);
  }
}
