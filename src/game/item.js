import { Text, RandomText } from "./text";
import { Verb } from "./verb";
import { createDynamicText } from "../utils/dynamicDescription";
import { selectInventory } from "../utils/selectors";
import { getBasicItemList, toTitleCase } from "../utils/textFunctions";

const vowels = ["a", "e", "i", "o", "u"];

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
    this.canHoldItems = false;
    this.capacity = -1;
    this.free = -1;
    this.preposition = "in";
    this.itemsCanBeSeen = true;
    this.article = `a${vowels.includes(this.name[0]) ? "n" : ""}`;

    this.addVerb(
      new Verb(
        "examine",
        true,
        [() => this.revealItems(), () => this.getFullDescription()],
        null,
        ["ex", "x", "look", "inspect"]
      )
    );

    if (this.holdable) {
      this.addVerb(
        new Verb(
          "take",
          () => {
            const inventory = selectInventory();
            return (
              this.container !== inventory &&
              (inventory.capacity === -1 || this.size < inventory.free)
            );
          },
          [
            () => {
              this.container.removeItem(this);
              selectInventory().addItem(this);
            },
            new RandomText(
              `You take the ${this.name}.`,
              `You pick up the ${this.name}.`,
              `You grab the ${this.name}.`
            )
          ],
          () =>
            this.container !== selectInventory()
              ? `You don't have enough room for the ${this.name}.`
              : `You're already carrying the ${this.name}!`,
          ["pick up", "steal", "grab", "hold"]
        )
      );

      const putVerb = new Verb(
        "put",
        (helper, other) =>
          other.canHoldItems && (other.free === -1 || this.size <= other.free),
        [
          (helper, other) => {
            this.container.removeItem(this); // TODO Handle when container is inventory
            return other.addItem(this);
          },
          (helper, other) =>
            `You put the ${this.name} ${other.preposition} the ${other.name}.`
        ],
        (helper, other) =>
          other.canHoldItems
            ? `There's no room ${other.preposition} the ${other.name}.`
            : `You can't put the ${this.name} ${other.preposition} the ${other.name}.`,
        ["place", "drop"]
      );
      putVerb.prepositional = true;

      this.addVerb(putVerb);
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
      return verb.attempt(...args);
    }
  }

  addItems(...items) {
    items.forEach(item => this.addItem(item));
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
    item.container = this; // This causes the item's aliases to also be added to this item

    if (this.free > 0) {
      this.free -= item.size;
    }
  }

  removeItem(item) {
    delete this.items[item.name];
    this.uniqueItems.delete(item);
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

  get capacity() {
    return this._capacity;
  }

  set capacity(capacity) {
    this._capacity = capacity;
    this.free = capacity;

    if (capacity > 0) {
      this.canHoldItems = true;
    }
  }

  get basicItemList() {
    return getBasicItemList([...this.uniqueItems]);
  }

  getFullDescription() {
    let description = this.description;
    const itemList = this.basicItemList;

    if (itemList.length) {
      const prep = toTitleCase(this.preposition);
      description += `\n\n${prep} the ${this.name} there's ${itemList}.`;
    }

    return description;
  }
}
