import { Text, RandomText } from "../interactions/text";
import { Verb } from "../verbs/verb";
import { createDynamicText } from "../../utils/dynamicDescription";
import { selectInventory } from "../../utils/selectors";
import {
  getBasicItemList,
  toTitleCase,
  getArticle
} from "../../utils/textFunctions";
import { getStore } from "../../redux/storeRegistry";
import { itemsRevealed } from "../../redux/gameActions";
import { debug } from "../../utils/consoleIO";

export function newItem(config) {
  const item = new Item();
  Object.entries(config).forEach(([key, value]) => (item[key] = value));
  return item;
}

export class Item {
  constructor(
    name = "item",
    description = "It's fairly ordinary looking",
    holdable = false,
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
    this.doNotList = false;

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
              this.roomListing = null;
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
          other !== this &&
          other.canHoldItems &&
          (other.free === -1 || this.size <= other.free),
        [
          (helper, other) => {
            this.roomListing = null;
            this.container.removeItem(this);
            return other.addItem(this);
          },
          (helper, other) =>
            `You put the ${this.name} ${other.preposition} the ${other.name}.`
        ],
        (helper, other) => {
          if (other === this) {
            return `You can't put the ${this.name} ${
              other.preposition
            } itself. That would be nonsensical.`;
          } else if (other.canHoldItems) {
            return `There's no room ${other.preposition} the ${other.name}.`;
          } else {
            return `You can't put the ${this.name} ${other.preposition} the ${
              other.name
            }.`;
          }
        },
        ["place", "drop"]
      );
      putVerb.makePrepositional("where");

      this.addVerb(putVerb);
    }
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
    this.article = getArticle(name);
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

  addVerbs(...verbs) {
    verbs.forEach(verb => this.addVerb(verb));
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
    const name = item.name.toLowerCase();

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
    delete this.items[item.name.toLowerCase()];
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
   * Adds holdable items this item hides to this item directly and non-holdable items
   * to this item's container e.g. adds hidden items to the room.
   */
  revealItems() {
    if (!this.itemsRevealed && this.container) {
      debug(`${this.name}: Revealing items`);
      this.hidesItems.forEach(item => {
        if (item.holdable && this.canHoldItems) {
          debug(`${this.name}: Adding holdable item ${item.name} to self`);
          this.addItem(item);
        } else {
          debug(
            `${this.name}: Adding item ${item.name} to parent container ${
              this.container.name
            } because either it isn't holdable or I am not a container`
          );
          this.container.addItem(item); // Don't want non-holdable item to be listed
        }
      });
      getStore().dispatch(
        itemsRevealed(this.hidesItems.map(item => item.name))
      );
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

  basicItemList(includeItemsWithRoomListing = true) {
    return getBasicItemList(
      [...this.uniqueItems].filter(
        item =>
          (includeItemsWithRoomListing || !item.roomListing) && !item.doNotList
      )
    );
  }

  getFullDescription() {
    let description = this.description;
    const itemList = this.basicItemList(false);
    const uniqueItemList = [...this.uniqueItems];
    const roomListings = uniqueItemList
      .filter(item => item.roomListing)
      .map(item => item.roomListing);

    if (roomListings.length) {
      description += `\n\n${roomListings.join(" ")}`;
    }

    if (itemList.length) {
      const prep = toTitleCase(this.preposition);
      const announceList =
        uniqueItemList.length < 8
          ? `there's ${itemList}.`
          : `you see:\n\n${itemList}`;
      description += `\n\n${prep} the ${this.name} ${announceList}`;
    }

    return description;
  }

  /*
   * Get items that are accesseible from this item. Includes items inside accessible containers
   * and this item itself.
   */
  get accessibleItems() {
    // Add this item, its aliases and the items it contains
    let items = { ...this.items, [this.name.toLowerCase()]: this };
    this.aliases.forEach(alias => (items[alias] = this));

    // Add items inside this item's containers
    [...this.uniqueItems].forEach(
      item => (items = { ...items, ...item.accessibleItems })
    );

    return items;
  }
}
