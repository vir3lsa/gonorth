import { getStore } from "../../redux/storeRegistry";
import { verbCreated, addKeywords } from "../../redux/gameActions";
import { ActionChain } from "../../utils/actionChain";
import { selectRoom } from "../../utils/selectors";

export function newVerb(config) {
  const { name } = config;

  if (!name) {
    throw Error("You must at least set the verb name.");
  }

  const verb = new Verb(name);
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
    object = null
  ) {
    this.name = name;
    this.isKeyword = isKeyword;
    this.aliases = aliases || [];
    this.object = object;
    this._parent = null;
    this.prepositional = false;
    this.prepositionOptional = false;
    this.interrogative = null;

    this.helpers = {
      object: this.object,
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
    return this._test;
  }

  /**
   * @param {boolean | ((helper) => boolean) | undefined} test
   */
  set test(test) {
    if (typeof test === "undefined") {
      this._test = () => true;
    } else if (typeof test === "boolean") {
      this._test = () => test;
    } else {
      this._test = test;
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

      if (this.isKeyword) {
        const keywordMap = this.aliases.reduce(
          (acc, alias) => {
            acc[alias] = this;
            return acc;
          },
          { [this.name]: this }
        );

        getStore().dispatch(addKeywords(keywordMap));
      }
    }
  }

  makePrepositional(interrogative, prepositionOptional) {
    this.prepositional = true;
    this.prepositionOptional = prepositionOptional;
    this.interrogative = interrogative;
  }

  attempt(...args) {
    if (this._test(this.helpers, ...args)) {
      return this.onSuccess.chain(...args);
    } else {
      return this.onFailure.chain(...args);
    }
  }
}

export class GoVerb extends Verb {
  constructor(name, aliases, isKeyword = false) {
    const getAdjacent = name => selectRoom().adjacentRooms[name.toLowerCase()];
    super(
      name,
      () => {
        const adjacentRoom = getAdjacent(name);
        return adjacentRoom && adjacentRoom.test();
      },
      () => {
        const adjacentRoom = getAdjacent(name);
        const goActionChain = selectRoom().go(name);
        const onSuccess = (adjacentRoom && adjacentRoom.onSuccess) || [
          `Going ${name}.`
        ];

        goActionChain.insertActions(...onSuccess);
        return goActionChain;
      },
      () => {
        const adjacentRoom = getAdjacent(name);
        return (
          (adjacentRoom && adjacentRoom.failureText) || "You can't go that way."
        );
      },
      aliases,
      isKeyword
    );
  }
}
