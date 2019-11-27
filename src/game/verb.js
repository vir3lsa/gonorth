import { getStore } from "../redux/storeRegistry";
import { verbCreated, addKeywords } from "../redux/gameActions";
import { ActionChain } from "../utils/actionChain";
import { selectRoom } from "../utils/selectors";

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
    this.name = name.trim().toLowerCase();
    this.isKeyword = isKeyword;
    this.aliases = aliases || [];
    this.object = object;
    this._parent = null;

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

  /**
   * @param {boolean | (() => boolean) | undefined} test
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
    this._onSuccess =
      onSuccess instanceof ActionChain ? onSuccess : new ActionChain(onSuccess);
    this._onSuccess.addHelpers(this.helpers);
  }

  set onFailure(onFailure) {
    this._onFailure =
      onFailure instanceof ActionChain ? onFailure : new ActionChain(onFailure);
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
      this._aliases.forEach(alias => {
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
    super(
      name,
      () => {
        const adjacentRoom = selectRoom().adjacentRooms[name.toLowerCase()];
        return adjacentRoom && adjacentRoom.test();
      },
      [`Going ${name}.`, () => selectRoom().go(name)],
      () => {
        const adjacentRoom = selectRoom().adjacentRooms[name.toLowerCase()];
        return (
          (adjacentRoom && adjacentRoom.failureText) || "You can't go that way."
        );
      },
      aliases,
      isKeyword
    );
  }
}
