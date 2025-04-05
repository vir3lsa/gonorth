import { ActionChain } from "./actionChain";
import { createChainableTest, normaliseTest } from "./sharedFunctions";

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

/**
 * An Effect is an action that can occur when {@link game/items/item!Item | Items} interact via a {@link game/verbs/verb!Verb | Verb}.
 * Rather than hard-coding the special-case interactions of certain Items into the Verb itself, Effects may be added for each pair of
 * Items. For example, if you have a "break" Verb that usually responds with "You can't break that", Effects could be used to allow
 * certain items to be broken when using a hammer.
 * 
 * When creating an Effect, the primary and secondary items to interact must be specified. However, the Effect may be configured to
 * accept any primary item e.g. placing any item onto a set of scales could produce an effect.
 * 
 * Effects can be configured to execute before, instead of or after the Verb, via a {@link utils/effects!VerbRelation | VerbRelation}.
 * As with Verbs, Effects may be given tests that must pass before they will execute. Unlike Verbs, the tests are optional - if no
 * tests are provided, the Effect will definitely execute. Whether the Verb actually executes is dependent on the VerbRelation, the
 * Effect's tests (if any), the result of the Effect's actions, and the Effect's 'successful' flag. The latter indicates whether the
 * Effect is considered to be successful when it executes - it's possible for an Effect to execute but still be considered
 * unsuccessful.
 */
export class Effect {
  primaryItem?: ItemOrString;
  secondaryItem: ItemOrString;
  verbName: string;
  successful: boolean;
  verbRelation: VerbRelation;
  testsChain?: ActionChain;
  actionChain: ActionChain;

  constructor(builder: EffectBuilder) {
    this.primaryItem = builder.config.primaryItem;
    this.secondaryItem = builder.config.secondaryItem!;
    this.verbName = builder.config.verbName!;
    this.successful = builder.config.successful ?? true;
    this.verbRelation = builder.config.verbRelation ?? VerbRelation.Before;
    this.testsChain = this.createTestsChain(builder.config.tests);
    this.actionChain = new ActionChain(...(builder.config.actions! as Action[]));
  }

  /**
   * Combines all SmartTests to form an ActionChain.
   *  
   * @param tests the SmartTests to combine.
   * @returns ActionChain
   */
  private createTestsChain(tests?: SmartTest[]) {
    if (tests && tests.length) {
      const testsChain = new ActionChain(
        ...(tests.map((itest) => {
          let onFailure = itest.onFailure as Action[];
          return createChainableTest((itest as SmartTest).test || itest, ...onFailure);
        }))
      );

      testsChain.renderNexts = false;
      return testsChain;
    }
  }

  /**
   * Attempts this Effect by running an SmartTests then, if they're successful, running the ActionChain
   * representing the effect itself.
   * 
   * @param context the Context in which the Effect is running.
   * @returns Boolean indicating whether the Effect executed successfully (and is considered successful).
   */
  async attempt(context: Context) {
    let result = false;
    const testsPassed = await this.testsChain?.chain(context) ?? true;

    if (testsPassed) {
      result = await this.actionChain.chain(context);
    }

    return result && this.successful;
  }

  static get Builder() {
    return EffectBuilder;
  }
}

export class EffectBuilder {
  config: Partial<EffectConfig> = {
    actions: [], tests: []
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

  withTest(test: Test, ...onFailure: Action[]) {
    const smartTest: SmartTest = { test: normaliseTest(test), onFailure };
    this.config.tests = [...this.config.tests!, smartTest];
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
