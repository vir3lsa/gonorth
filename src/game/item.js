import { Text, RandomText } from "./text";
import { Verb } from "./verb";
import { createDynamicText } from "../utils/dynamicDescription";
import { selectInventory } from "../utils/selectors";
import { getStore } from "../redux/storeRegistry";
import { pickUpItem } from "../redux/gameActions";

export default class Item {
  constructor(
    name,
    description,
    holdable,
    size = 1,
    verbs = [],
    aliases = [],
    hidesItems = []
  ) {
    this.name = name;
    this.description = description;
    this.holdable = holdable;
    this.size = size;
    this.visible = true;
    this.aliases = aliases;
    this.container = null;
    this.verbs = verbs;
    this.hidesItems = hidesItems;
    this.roomListing = null;
    this.items = {};
    this.uniqueItems = new Set();

    this.addVerb(
      new Verb(
        "examine",
        true,
        [() => this.revealItems(), this._description],
        null,
        ["ex", "x", "look at", "inspect"]
      )
    );

    if (this.holdable) {
      this.addVerb(
        new Verb(
          "take",
          () => this.size < selectInventory().free && this.container,
          [
            () => {
              this.container.removeItem(this);
              return getStore().dispatch(pickUpItem(this));
            },
            new RandomText(
              `You take the ${this.name}.`,
              `You pick up the ${this.name}.`,
              `You grab the ${this.name}.`
            )
          ],
          () =>
            this.container
              ? `You don't have enough room for the ${this.name}.`
              : `You're already carrying the ${this.name}!`,
          ["pick up", "steal", "grab", "hold"]
        )
      );
    }
  }

  get description() {
    return this._description(this);
  }

  /**
   * @param {string | string[] | function | Text | undefined } description
   */
  set description(description) {
    this._description = createDynamicText(description);
  }

  addVerb(verb) {
    this._verbs[verb.name.toLowerCase()] = verb;
    verb.parent = this;
  }

  get verbs() {
    return this._verbs;
  }

  getVerb(name) {
    return this._verbs[name];
  }

  _addAliasesToContainer() {
    if (this._container && this.aliases) {
      this.aliases.forEach(alias => {
        this._container.items[alias.toLowerCase()] = this;
      });
    }
  }

  /**
   * @param {Verb[] | Verb} verbs
   */
  set verbs(verbs) {
    this._verbs = {};
    const verbArray = Array.isArray(verbs) ? verbs : [verbs];
    verbArray.forEach(verb => this.addVerb(verb));
  }

  /**
   * @param {Item} container
   */
  set container(container) {
    this._container = container;
    this._addAliasesToContainer();
  }

  get container() {
    return this._container;
  }

  get aliases() {
    return this._aliases;
  }

  /**
   * @param {string | string[]} aliases
   */
  set aliases(aliases) {
    const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
    this._aliases = aliasArray;
    this._addAliasesToContainer();
  }

  /**
   * Attempt a verb.
   * @param {string} verbName
   * @param  {...any} args to pass to the verb
   */
  try(verbName, ...args) {
    const verb = this.verbs[verbName.toLowerCase()];

    if (verb) {
      return verb.attempt(this, ...args);
    }
  }

  /**
   * Adds an item to this item's roster.
   * @param {Item} item The item to add.
   */
  addItem(item) {
    const name = item.name;

    if (!name) {
      throw Error("Item does not have a name");
    }

    if (this.items[name]) {
      throw Error(`Item '${this.name}' already has an item called '${name}'`);
    }

    this.uniqueItems.add(item);
    this.items[name] = item;
    item.container = this;
  }

  removeItem(item) {
    delete this.items[item.name];
    item.container = null;

    // Remove aliases
    item.aliases.forEach(alias => {
      delete this.items[alias];
    });
  }

  set hidesItems(hidesItems) {
    this._hidesItems = Array.isArray(hidesItems) ? hidesItems : [hidesItems];
  }

  get hidesItems() {
    return this._hidesItems;
  }

  /**
   * Adds the items this item hides to this item's container e.g. adds hidden items
   * to the room.
   */
  revealItems() {
    if (!this.itemsRevealed && this.container) {
      this.hidesItems.forEach(item => this.container.addItem(item));
      this.itemsRevealed = true;
    }
  }

  get roomListing() {
    return this._roomListing;
  }

  set roomListing(listing) {
    this._roomListing = listing;
  }

  get items() {
    return this._items;
  }

  set items(items) {
    this._items = items;
    this.uniqueItems = new Set(...Object.values(this._items));
  }
}
