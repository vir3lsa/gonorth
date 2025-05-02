import { getStore } from "../../redux/storeRegistry";
import { verbCreated } from "../../redux/gameActions";
import { ActionChain } from "../../utils/actionChain";
import { selectEffects, selectRoom } from "../../utils/selectors";
import { createChainableTest, normaliseTest, playerHasItem } from "../../utils/sharedFunctions";
import { checkAutoActions } from "../input/autoActionExecutor";
import { VerbRelation } from "../../utils/effects";

const { Before, Instead, After } = VerbRelation;

/**
 * A Verb represents a thing the player can do. It should generally have a name that's a grammatical verb,
 * as the player will activate it by typing a command. Verbs may be attached to {@link game/items/room!Room | Rooms} or
 * {@link game/items/item!Item | Items}, or may be standalone keywords that can be used independently.
 *
 * Verbs generally define one or more tests that must pass in order to proceed, as well as actions
 * to be executed if all the tests pass. Legacy tests are simply functions that
 * return `true` or `false`. Newer {@link types/types!SmartTest | SmartTests} define both a test function and the
 * action that's performed if the test fails, which will usually be a response explaining why the failure
 * occurred.
 *
 * All functions passed to {@link types/types!SmartTest | SmartTests } and `onSuccess` and `onFailure` callbacks receive
 * context objects containing, as a minimum, the {@link Verb} and the {@link game/items/item!Item | Item} it was invoked on.
 *
 * Verbs are constructed using a builder.
 *
 * ```ts
 * const throw = new Verb.Builder("throw")
 *   .withAliases("chuck", "lob", "hurl", "yeet")
 *   .withTest(({ item }) => playerHasItem(item), `You're not holding the ${item.name}.`)
 *   .onSuccess(({ item }) => `You chuck the ${item.name} as far as you can.`)
 *   .build();
 * ```
 */
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
  private _parent?: ItemT;
  private _tests!: ActionChainT;
  private _name!: string;
  private _onSuccess!: ActionChainT;
  private _onFailure!: ActionChainT;
  private _aliases!: string[];

  constructor(builder: VerbBuilder) {
    const {
      name,
      tests = [],
      onSuccess,
      onFailure,
      aliases,
      isKeyword,
      prepositional,
      interrogative,
      prepositionOptional,
      description,
      expectedArgs = ["item", "other", "alias"],
      ...remainingConfig
    } = builder.config;

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
    this.test = tests;

    // Call the onSuccess setter
    this.onSuccess = onSuccess;

    // Call the onFailure setter
    this.onFailure = onFailure;

    if (prepositional) {
      this.makePrepositional(interrogative as string, Boolean(prepositionOptional));
    }

    Object.entries(remainingConfig).forEach(([key, value]) => (this[key] = value));
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
        return createChainableTest((itest as SmartTest).test || itest, ...onFailure);
      }) as Action[])
    );
    this._tests.renderNexts = false;
  }

  /**
   * Add a test to the end of this Verb's test chain.
   * @param test The test to add.
   * @param onFailure The onFailure action to execute when the test fails.
   */
  addTest(test: Test, ...onFailure: Action[]) {
    const chainableTest = createChainableTest(test, onFailure);
    this._tests.addAction(chainableTest);
  }

  /**
   * Insert a test at the beginning of this Verb's test chain.
   * @param test The test to add.
   * @param onFailure The onFailure action to execute when the test fails.
   */
  insertTest(test: Test, ...onFailure: Action[]) {
    const chainableTest = createChainableTest(test, ...onFailure);
    this._tests.insertAction(chainableTest);
  }

  set onSuccess(onSuccess: ContextAction | ContextAction[]) {
    const onSuccessArray = Array.isArray(onSuccess) ? onSuccess : [onSuccess];
    this._onSuccess = new ActionChain(...(onSuccessArray as Action[]));
  }

  set onFailure(onFailure: ContextAction | ContextAction[]) {
    const onFailureArray = Array.isArray(onFailure) ? onFailure : [onFailure];
    // Indicate the verb failure to the action chain.
    onFailureArray.unshift(() => false);
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
    const wholeContext = args.length ? this.augmentContext(context, args) : context as Context;

    // Check for auto actions that need to run before this verb.
    const autoActionResult = await checkAutoActions(wholeContext);

    if (!autoActionResult) {
      return false;
    }

    const { item, other } = wholeContext;

    // See if there's an effect for this combination of items and verb.
    const effect = selectEffects().getEffect(item, other, this.name);
    let effectResult = true;

    if (effect && effect.verbRelation !== After) {
      // Effect happens before or instead of the verb.
      effectResult = await effect.attempt(wholeContext);

      if (effect.verbRelation === Instead) {
        // Effect happens instead of the verb.
        return effectResult;
      }
    }

    // All tests, or an effect, must be successful for verb to proceed.
    const success = effect?.verbRelation === Before ? effectResult : await this._tests.chain(wholeContext);
    let verbPromise;

    if (success) {
      verbPromise = this.onSuccess.chain(wholeContext);

      if (!effect || effect.verbRelation === Before) {
        // No effect, or it happens before the verb.
        return verbPromise;
      }
    } else {
      return this.onFailure.chain(wholeContext);
    }

    // Effect happens after the verb.
    await verbPromise;
    return effect.attempt(wholeContext);
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
    return VerbBuilder;
  }
}

export class VerbBuilder {
  config: VerbConfig;
  constructor(name: string = "") {
    this.config = { name, tests: [] };
  }

  withName(name: string) {
    this.config.name = name;
    return this;
  }

  withTests(...tests: SmartTest[]) {
    this.config.tests = [...this.config.tests!, ...tests];
    return this;
  }

  withTest(test: Test, ...onFailure: Action[]) {
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

  onSuccess(...onSuccess: ContextAction[]) {
    this.config.onSuccess = onSuccess;
    return this;
  }

  onFailure(...onFailure: ContextAction[]) {
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
    if (!this.config.name) {
      throw Error("You must at least set the verb name.");
    }

    return new Verb(this);
  }
}

export class GoVerb extends Verb {
  constructor(builder: GoVerbBuilder) {
    super(builder);
  }

  static get Builder() {
    return GoVerbBuilder;
  }
}

export class GoVerbBuilder extends VerbBuilder {
  constructor(name: string = "") {
    super(name);
    this.config.description = `Travel ${name}.`;
  }

  withCurrentRoom(currentRoom: RoomT) {
    this.config.currentRoom = currentRoom;

    const { name } = this.config;
    const getAdjacent = (name: string) => currentRoom.adjacentRooms[name.toLowerCase()];

    this.withTest(() => Boolean(getAdjacent(name)?.test), "You can't go that way.");
    this.withTest(
      () => getAdjacent(name)!.test!(),
      () => getAdjacent(name)!.onFailure
    );

    this.onSuccess(
      () => {
        const adjacentRoom = getAdjacent(name);
        return adjacentRoom?.onSuccess || `Going ${name}.`;
      },
      () => selectRoom().go(name)
    );

    return this;
  }

  build() {
    const { name, currentRoom } = this.config;

    if (!name) {
      throw Error("You must at least set the verb name.");
    }

    if (!currentRoom) {
      console.error("Tried to build a GoVerb without a current room. Current room must be supplied.");
    }

    return new GoVerb(this);
  }
}
