import { getStore } from "../../redux/storeRegistry";
import { verbCreated } from "../../redux/gameActions";
import { ActionChain } from "../../utils/actionChain";
import { selectRoom } from "../../utils/selectors";

export function newVerb(config) {
  const { name, test, onSuccess, onFailure, aliases, isKeyword, prepositional, interrogative, prepositionOptional } =
    config;

  if (!name) {
    throw Error("You must at least set the verb name.");
  }

  const verb = new Verb(name, test, onSuccess, onFailure, aliases, isKeyword);

  if (prepositional) {
    verb.makePrepositional(interrogative, prepositionOptional);
  }

  Object.entries(config).forEach(([key, value]) => (verb[key] = value));
  return verb;
}

export class Verb {
  constructor(
    name,
    test = true,
    onSuccess = [],
    onFailure = [],
    aliases = [],
    isKeyword = false,
    description = "",
    object = null,
    expectedArgs = ["item"]
  ) {
    this.name = name;
    this.isKeyword = isKeyword;
    this.doNotList = !isKeyword;
    this.aliases = aliases || [];
    this.object = object;
    this._parent = null;
    this.prepositional = false;
    this.prepositionOptional = false;
    this.interrogative = null;
    this.description = description;
    this.expectsArgs = false; // Used by some keywords.
    this.expectedArgs = expectedArgs;

    this.helpers = {
      object: this.object
    };

    // Call test setter
    this.test = test;

    // Call the onSuccess setter
    this.onSuccess = onSuccess;

    // Call the onFailure setter
    this.onFailure = onFailure;
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
  set test(test) {
    this._tests = [];
    const tests = Array.isArray(test) ? test : [test];
    tests.forEach((itest) => this.addTest(itest));
  }

  addTest(test) {
    if (typeof test === "undefined") {
      this._tests.push(() => true);
    } else if (typeof test === "boolean") {
      this._tests.push(() => test);
    } else {
      this._tests.push(test);
    }
  }

  set onSuccess(onSuccess) {
    const onSuccessArray = Array.isArray(onSuccess) ? onSuccess : [onSuccess];
    this._onSuccess = new ActionChain(...onSuccessArray);
    this._onSuccess.addHelpers(this.helpers);
  }

  set onFailure(onFailure) {
    const onFailureArray = Array.isArray(onFailure) ? onFailure : [onFailure];
    this._onFailure = new ActionChain(...onFailureArray);
    this._onFailure.addHelpers(this.helpers);
  }

  get onSuccess() {
    return this._onSuccess;
  }

  get onFailure() {
    return this._onFailure;
  }

  _addAliasesToParent() {
    if (this._parent && this._aliases) {
      this._aliases.forEach((alias) => {
        this._parent.verbs[alias] = this;
      });
    }
  }

  /**
   * @param {Item} parent
   */
  set parent(parent) {
    this._parent = parent;
    this._addAliasesToParent();
  }

  /**
   * @param {string | string[]} aliases
   */
  set aliases(aliases) {
    this._aliases = [];
    this.addAliases(aliases);
  }

  get aliases() {
    return this._aliases;
  }

  addAliases(aliases) {
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

  makePrepositional(interrogative, prepositionOptional) {
    this.prepositional = true;
    this.prepositionOptional = prepositionOptional;
    this.interrogative = interrogative;
    this.expectedArgs.push("other");
  }

  attempt(...args) {
    // Turn the anonymous args into key/value pairs based on the expected args. Any additional unexpected args won't be included.
    const context = this.expectedArgs.reduce((acc, key, index) => {
      acc[key] = args[index];
      return acc;
    }, {});

    // All tests must be successful for verb to proceed.
    const success = this._tests.reduce((successAcc, test) => successAcc && test({ ...this.helpers, ...context }), true);

    if (success) {
      return this.onSuccess.chain(context);
    } else {
      return this.onFailure.chain(context);
    }
  }

  static get Builder() {
    return Builder;
  }
}

class Builder {
  constructor() {
    this.config = {};
  }

  withName(name) {
    this.config.name = name;
    return this;
  }

  withTest(test) {
    this.config.test = test;
    return this;
  }

  withDescription(description) {
    this.config.description = description;
    return this;
  }

  withAliases(...aliases) {
    this.config.aliases = aliases;
    return this;
  }

  withOnSuccess(...onSuccess) {
    this.config.onSuccess = onSuccess;
    return this;
  }

  withOnFailure(...onFailure) {
    this.config.onFailure = onFailure;
    return this;
  }

  isKeyword(isKeyword = true) {
    this.config.isKeyword = isKeyword;
    return this;
  }

  makePrepositional(interrogative, prepositionOptional) {
    this.config.prepositional = true;
    this.config.interrogative = interrogative;
    this.config.prepositionOptional = prepositionOptional;
    return this;
  }

  build() {
    return newVerb(this.config);
  }
}

export class GoVerb extends Verb {
  constructor(name, aliases, isKeyword = false) {
    const getAdjacent = (name) => selectRoom().adjacentRooms[name.toLowerCase()];
    super(
      name,
      () => {
        const adjacentRoom = getAdjacent(name);
        return adjacentRoom && adjacentRoom.test();
      },
      [
        () => {
          const adjacentRoom = getAdjacent(name);
          return (adjacentRoom && adjacentRoom.onSuccess) || `Going ${name}.`;
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
