import { getStore } from "../redux/storeRegistry";
import { verbCreated } from "../redux/gameActions";
import { Append } from "./interaction";
import { chainActions, createChainableFunction } from "../utils/actionChain";

export class Verb {
  constructor(name, test = true, onSuccess = [], onFailure = [], aliases = []) {
    this.name = name.trim().toLowerCase();
    this.aliases = aliases || [];
    this._parent = null;

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
    this._onSuccess = createChainableFunction(onSuccess);
  }

  set onFailure(onFailure) {
    this._onFailure = createChainableFunction(onFailure);
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
      getStore().dispatch(verbCreated([this.name, ...this.aliases]));
    }
  }

  attempt(...args) {
    if (this._test(...args)) {
      return chainActions(this.onSuccess, ...args);
    } else {
      return chainActions(this.onFailure, ...args);
    }
  }
}

export class GoVerb extends Verb {
  constructor(name, aliases) {
    super(
      name,
      room => {
        const adjacentRoom = room.adjacentRooms[name.toLowerCase()];
        return adjacentRoom && adjacentRoom.test();
      },
      [`Going ${name}.`, room => room.go(name)],
      room => {
        const adjacentRoom = room.adjacentRooms[name.toLowerCase()];
        return adjacentRoom && adjacentRoom.failureText
          ? new Append(adjacentRoom.failureText)
          : new Append("You can't go that way.");
      },
      aliases
    );
  }
}
