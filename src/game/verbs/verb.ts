import { getStore } from "../../redux/storeRegistry";
import { verbCreated } from "../../redux/gameActions";
import { ActionChain } from "../../utils/actionChain";
import { selectEffects, selectRoom } from "../../utils/selectors";
import { normaliseTest, playerHasItem } from "../../utils/sharedFunctions";
import { checkAutoActions } from "../input/autoActionExecutor";
import { VerbRelation } from "../../utils/effects";

const { Before, Instead, After } = VerbRelation;

export function newVerb(config: VerbConfig) {
  const {
    name,
    tests,
    onSuccess,
    onFailure,
    aliases,
    isKeyword,
    prepositional,
    interrogative,
    prepositionOptional,
    description,
    expectedArgs,
    ...remainingConfig
  } = config;

  if (!name) {
    throw Error("You must at least set the verb name.");
  }

  const verb = new Verb(name, tests, onSuccess, onFailure, aliases, isKeyword, description, expectedArgs);

  if (prepositional) {
    verb.makePrepositional(interrogative as string, Boolean(prepositionOptional));
  }

  Object.entries(remainingConfig).forEach(([key, value]) => (verb[key] = value));
  return verb;
}

const identity = () => undefined;

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
  _tests!: ActionChainT;
  _name!: string;
  _onSuccess!: ActionChainT;
  _onFailure!: ActionChainT;
  _aliases!: string[];

  constructor(
    name: string,
    test: Test | SmartTest | (Test | SmartTest)[] = true,
    onSuccess: ContextAction | ContextAction[] = [],
    onFailure: ContextAction | ContextAction[] = [],
    aliases: string[] = [],
    isKeyword = false,
    description = "",
    expectedArgs = ["item", "other", "alias"]
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

  get test(): ActionChainT {
    return this._tests;
  }

  set test(test: Test | SmartTest | (Test | SmartTest)[] | ActionChainT) {
    if (test instanceof ActionChain) {
      // If the test is already an ActionChain, set it and return. Required to keep TypeScript happy.
      this._tests = test as ActionChainT;
      return;
    }

    const tests = Array.isArray(test) ? test : [test];
    this._tests = new ActionChain(
      ...(tests.map((itest) => {
        let onFailure = (itest as SmartTest).onFailure as Action[];
        onFailure = Array.isArray(onFailure) ? onFailure : [onFailure];
        return this.createChainableTest((itest as SmartTest).test || itest, ...onFailure);
      }) as Action[])
    );
    this._tests.renderNexts = false;
  }

  /**
   * Add a test to the end of this verb's test chain.
   * @param test the test to add.
   * @param onFailure the onFailure action to execute when the test fails.
   */
  addTest(test: Test, ...onFailure: Action[]) {
    const chainableTest = this.createChainableTest(test, onFailure);
    this._tests.addAction(chainableTest);
  }

  /**
   * Insert a test at the beginning of this verb's test chain.
   * @param test the test to add.
   * @param onFailure the onFailure action to execute when the test fails.
   */
  insertTest(test: Test, ...onFailure: Action[]) {
    const chainableTest = this.createChainableTest(test, ...onFailure);
    this._tests.insertAction(chainableTest);
  }

  createChainableTest(test: Test, ...onFailure: Action[]) {
    const normalisedTest = normaliseTest(test);
    const onFailureChain = new ActionChain(...(onFailure || identity));

    const chainableTest: Action = (context) => {
      const result = normalisedTest(context as Context);

      if (!result) {
        context.fail!();
        return onFailureChain;
      }
    };

    return chainableTest;
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
    const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
    this.addAliases(...aliasArray);
  }

  get aliases(): string[] {
    return this._aliases;
  }

  addAliases(...aliases: string[]) {
    if (aliases) {
      this._aliases.push(...aliases);
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
   * Creates verb context before attempting the verb.
   * @param args Arguments to pass to the verb functions.
   * @returns A Promise that resolves when the verb's actions have executed.
   */
  attempt(...args: unknown[]) {
    // Turn the anonymous args into key/value pairs based on the expected args. Any additional unexpected args won't be included.
    const context = this.createContext(args);
    return this.attemptWithContext(context);
  }

  /**
   * Checks auto actions that should precede the verb, tests the verb's conditions and runs the verb's success or
   * failure actions accordingly.
   * @param context The context in which the verb is attempted.
   * @param args Additional arguments to add to the context.
   * @returns A Promise that resolves when the verb's actions have executed.
   */
  async attemptWithContext(context: Partial<Context>, ...args: unknown[]) {
    const wholeContext = args.length ? this.augmentContext(context, args) : context;

    // Check for auto actions that need to run before this verb.
    const autoActionResult = await checkAutoActions(wholeContext as Context);

    if (!autoActionResult) {
      return false;
    }

    const { item, other } = wholeContext;

    const effect = selectEffects().getEffect(item, other, this.name);

    // See if there's an effect for this combination of items and verb.
    const effectChain = effect?.actionChain;

    if (effect && effectChain && effect.verbRelation !== After) {
      // Effect happens before or instead of the verb.
      const effectResult = await effectChain.chain(wholeContext);

      if (effect.verbRelation === Instead) {
        // Effect happens instead of the verb.
        return effectResult;
      }
    }

    // All tests, or an effect, must be successful for verb to proceed.
    const success = effect?.verbRelation === Before ? effect.successful : await this._tests.chain(wholeContext);
    let verbPromise;

    if (success) {
      verbPromise = this.onSuccess.chain(wholeContext);

      if (!effect || !effectChain || effect.verbRelation === Before) {
        // No effect, or it happens before the verb.
        return verbPromise;
      }
    } else {
      return this.onFailure.chain(wholeContext);
    }

    // Effect happens after the verb.
    await verbPromise;
    return effectChain.chain(wholeContext);
  }

  /*
   * Turns anonymous args into key/value pairs based on the expected args. Any additional unexpected args won't be included.
   */
  createContext(args: unknown[]) {
    return this.createContextWithExpectedArgs(args, this.expectedArgs);
  }

  augmentContext(context: Partial<Context>, args: unknown[]) {
    const stillExpectedArgs = this.expectedArgs.filter((expected) => !Object.keys(context).includes(expected));
    return { ...context, ...this.createContextWithExpectedArgs(args, stillExpectedArgs) };
  }

  createContextWithExpectedArgs(args: unknown[], expectedArgs: string[]) {
    const context = expectedArgs.reduce((acc, key, index) => {
      acc[key] = args[index];
      return acc;
    }, {} as Context);

    context.verb = this;

    // See if one of the args looks like the alias the verb was invoked with.
    if (typeof context.alias === "string") {
      context.alias = context.alias.toLowerCase();
    }

    return context;
  }

  static get Builder() {
    return Builder;
  }
}

export class Builder {
  config: VerbConfig;
  constructor(name: string = "") {
    this.config = { name, tests: [] };
  }

  withName(name: string) {
    this.config.name = name;
    return this;
  }

  withTest(...tests: (Test | SmartTest)[]) {
    this.config.tests = [...this.config.tests!, ...tests];
    return this;
  }

  withSmartTest(test: Test, ...onFailure: Action[]) {
    const smartTest: SmartTest = { test: normaliseTest(test), onFailure };
    this.config.tests = [...this.config.tests!, smartTest];
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

  withExpectedArgs(...args: string[]) {
    this.config.expectedArgs = args;
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

  doNotList(doNotList = true) {
    this.config.doNotList = doNotList;
    return this;
  }

  build() {
    return newVerb(this.config);
  }
}

export class GoVerb extends Verb {
  constructor(name: string, aliases: string[], currentRoom: RoomT) {
    const getAdjacent = (name: string) => currentRoom.adjacentRooms[name.toLowerCase()];
    super(
      name,
      [
        {
          test: () => Boolean(getAdjacent(name)?.test),
          onFailure: "You can't go that way."
        },
        {
          test: () => getAdjacent(name)!.test!(),
          onFailure: () => getAdjacent(name)!.failureText
        }
      ],
      [
        () => {
          const adjacentRoom = getAdjacent(name);
          return adjacentRoom?.onSuccess || `Going ${name}.`;
        },
        () => selectRoom().go(name)
      ],
      [],
      aliases,
      false,
      `Travel ${name}.`
    );
  }
}
