import { getStore } from "../../redux/storeRegistry";
import { verbCreated } from "../../redux/gameActions";
import { ActionChain } from "../../utils/actionChain";
import { selectEffects, selectRoom } from "../../utils/selectors";
import { playerHasItem } from "../../utils/sharedFunctions";
import { checkAutoActions } from "../input/autoActionExecutor";

export function newVerb(config: VerbConfig) {
  const { name, tests, onSuccess, onFailure, aliases, isKeyword, prepositional, interrogative, prepositionOptional } =
    config;

  if (!name) {
    throw Error("You must at least set the verb name.");
  }

  const verb = new Verb(name, tests, onSuccess, onFailure, aliases, isKeyword);

  if (prepositional) {
    verb.makePrepositional(interrogative as string, Boolean(prepositionOptional));
  }

  Object.entries(config).forEach(([key, value]) => (verb[key] = value));
  return verb;
}

export class Verb {
  [property: string]: unknown;
  isKeyword;
  doNotList;
  prepositional;
  prepositionOptional;
  interrogative: string | null;
  description;
  expectsArgs;
  expectedArgs;
  remote;
  _parent?: ItemT;
  _tests!: TestFunction[];
  _name!: string;
  _onSuccess!: ActionChainT;
  _onFailure!: ActionChainT;
  _aliases!: string[];

  constructor(
    name: string,
    test: Test | Test[] = true,
    onSuccess: ContextAction | ContextAction[] = [],
    onFailure: ContextAction | ContextAction[] = [],
    aliases: string[] = [],
    isKeyword = false,
    description = "",
    expectedArgs = ["item", "other"]
  ) {
    this.name = name;
    this.isKeyword = isKeyword;
    this.doNotList = !isKeyword;
    this.aliases = aliases || [];
    this._parent = undefined;
    this.prepositional = false;
    this.prepositionOptional = false;
    this.interrogative = null;
    this.description = description;
    this.expectsArgs = false; // Used by some keywords.
    this.expectedArgs = expectedArgs;
    this.remote = false;

    // Call test setter
    this.test = test;

    // Call the onSuccess setter
    this.onSuccess = onSuccess;

    // Call the onFailure setter
    this.onFailure = onFailure;

    // The player must be holding holdable items in order to use them.
    this.addTest(({ item }) => !item || this.remote || !item.holdable || playerHasItem(item));

    // The player must be holding holdable indirect items in order to use them.
    this.addTest(({ other }) => !other || this.remote || !other.holdable || playerHasItem(other));
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name.trim().toLowerCase();
  }

  get test() {
    return this._tests;
  }

  /**
   * @param {boolean | ((helper) => boolean) | undefined} test
   */
  set test(test: Test | Test[]) {
    this._tests = [];
    const tests = Array.isArray(test) ? test : [test];
    tests.forEach((itest) => this.addTest(itest));
  }

  addTest(test: Test) {
    if (typeof test === "undefined") {
      this._tests.push(() => true);
    } else if (typeof test === "boolean") {
      this._tests.push(() => test);
    } else {
      this._tests.push(test);
    }
  }

  set onSuccess(onSuccess: ContextAction | ContextAction[]) {
    const onSuccessArray = Array.isArray(onSuccess) ? onSuccess : [onSuccess];
    this._onSuccess = new ActionChain(...(onSuccessArray as Action[]));
  }

  set onFailure(onFailure: ContextAction | ContextAction[]) {
    const onFailureArray = Array.isArray(onFailure) ? onFailure : [onFailure];
    onFailureArray.unshift(({ item, fail }) => {
      if (!this.remote && item?.holdable && !playerHasItem(item)) {
        fail!(); // You can't do this verb without holding the item, so we'll say that and go no further.
        const article = item.properNoun ? "" : "the ";
        return `You're not holding ${article}${item.name}.`;
      }

      return false; // Indicate the verb failure to the action chain.
    });
    this._onFailure = new ActionChain(...(onFailureArray as Action[]));
  }

  get onSuccess(): ActionChainT {
    return this._onSuccess;
  }

  get onFailure(): ActionChainT {
    return this._onFailure;
  }

  _addAliasesToParent() {
    if (this._parent && this._aliases) {
      this._aliases.forEach((alias) => {
        this._parent!.verbs[alias] = this;
      });
    }
  }

  set parent(parent: ItemT) {
    this._parent = parent;
    this._addAliasesToParent();
  }

  set aliases(aliases: string | string[]) {
    this._aliases = [];
    this.addAliases(aliases);
  }

  get aliases(): string[] {
    return this._aliases;
  }

  addAliases(aliases: string | string[]) {
    if (aliases) {
      const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
      this._aliases.push(...aliasArray);
      this._addAliasesToParent();
      const nameMap = this.aliases.reduce(
        (acc, alias) => {
          acc[alias] = this.name;
          return acc;
        },
        { [this.name]: this.name }
      );
      getStore().dispatch(verbCreated(nameMap));
    }
  }

  makePrepositional(interrogative: string, prepositionOptional: boolean = false) {
    this.prepositional = true;
    this.prepositionOptional = prepositionOptional;
    this.interrogative = interrogative;
  }

  /**
   * Checks auto actions that should precede the verb, tests the verb's conditions and runs the verb's success or
   * failure actions accordingly.
   * @param args Arguments to pass to the verb functions.
   * @returns A Promise that resolves when the verb's actions have executed.
   */
  async attempt(...args: unknown[]) {
    // Turn the anonymous args into key/value pairs based on the expected args. Any additional unexpected args won't be included.
    const context = this.createContext(args);

    // Check for auto actions that need to run before this verb.
    const autoActionResult = await checkAutoActions(context);

    if (!autoActionResult) {
      return false;
    }

    const { item, other } = context;

    const effect = selectEffects().getEffect(item, other, this.name);

    if (effect) {
      // See if there's an effect for this combination of items and verb.
      const effectChain = effect.effects;

      if (effectChain) {
        const effectResult = await effectChain.chain(context);
        const continueVerb = effect.continueVerb;

        if (!continueVerb) {
          return effectResult;
        }
      }
    }

    // All tests, or an effect, must be successful for verb to proceed.
    const success = effect
      ? effect.successful
      : this._tests.reduce((successAcc, test) => successAcc && test(context), true);

    if (success) {
      return this.onSuccess.chain(context);
    } else {
      return this.onFailure.chain(context);
    }
  }

  /*
   * Turns anonymous args into key/value pairs based on the expected args. Any additional unexpected args won't be included.
   */
  createContext(args: unknown[]) {
    const context = this.expectedArgs.reduce((acc, key, index) => {
      acc[key] = args[index];
      return acc;
    }, {} as Context);

    return { ...context, verb: this };
  }

  static get Builder() {
    return Builder;
  }
}

class Builder {
  config: VerbConfig;
  constructor(name: string = "") {
    this.config = { name, tests: [] };
  }

  withName(name: string) {
    this.config.name = name;
    return this;
  }

  withTest(...tests: Test[]) {
    this.config.tests = [...this.config.tests!, ...tests];
    return this;
  }

  withDescription(description: string) {
    this.config.description = description;
    return this;
  }

  withAliases(...aliases: string[]) {
    this.config.aliases = aliases;
    return this;
  }

  withOnSuccess(...onSuccess: ContextAction[]) {
    this.config.onSuccess = onSuccess;
    return this;
  }

  withOnFailure(...onFailure: ContextAction[]) {
    this.config.onFailure = onFailure;
    return this;
  }

  isKeyword(isKeyword = true) {
    this.config.isKeyword = isKeyword;
    return this;
  }

  expectsArgs(expectsArgs = true) {
    this.config.expectsArgs = expectsArgs;
    return this;
  }

  makePrepositional(interrogative: string, prepositionOptional: boolean = false) {
    this.config.prepositional = true;
    this.config.interrogative = interrogative;
    this.config.prepositionOptional = prepositionOptional;
    return this;
  }

  isRemote(remote = true) {
    this.config.remote = remote;
    return this;
  }

  build() {
    return newVerb(this.config);
  }
}

export class GoVerb extends Verb {
  constructor(name: string, aliases: string[], isKeyword = false) {
    const getAdjacent = (name: string) => selectRoom().adjacentRooms[name.toLowerCase()];
    super(
      name,
      () => {
        const adjacentRoom = getAdjacent(name);
        return adjacentRoom?.test?.() || false;
      },
      [
        () => {
          const adjacentRoom = getAdjacent(name);
          return adjacentRoom?.onSuccess || `Going ${name}.`;
        },
        () => selectRoom().go(name)
      ],
      () => {
        const adjacentRoom = getAdjacent(name);
        return (adjacentRoom && adjacentRoom.failureText) || "You can't go that way.";
      },
      aliases,
      isKeyword,
      `Travel ${name}.`
    );
  }
}
