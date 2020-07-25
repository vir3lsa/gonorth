import { RandomText } from "../interactions/text";
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
import { commonWords } from "../constants";

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
    this.container = null;
    this.verbs = verbs;
    this.hidesItems = hidesItems;
    this.containerListing = null;
    this.items = {};
    this.uniqueItems = new Set();
    this.canHoldItems = false;
    this.capacity = -1;
    this.free = -1;
    this.preposition = "in";
    this.itemsVisibleFromRoom = false;
    this.itemsVisibleFromSelf = true;
    this.doNotList = false;

    this.aliases = [];
    this.createAliases(name);
    aliases.forEach(alias => this.createAliases(alias));

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
              this.container.itemsVisibleFromSelf &&
              this.container !== inventory &&
              (inventory.capacity === -1 || this.size < inventory.free)
            );
          },
          [
            () => {
              this.container.removeItem(this);
              selectInventory().addItem(this);
              this.containerListing = null;
            },
            new RandomText(
              `You take the ${this.name}.`,
              `You pick up the ${this.name}.`,
              `You grab the ${this.name}.`
            )
          ],
          () => {
            if (!this.container.itemsVisibleFromSelf) {
              return "You can't see that.";
            } else if (this.container !== selectInventory()) {
              return `You don't have enough room for the ${this.name}.`;
            } else {
              return `You're already carrying the ${this.name}!`;
            }
          },
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
            this.containerListing = null;
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

  _addAliasesToContainer(aliases) {
    if (this._container && aliases) {
      aliases.forEach(alias => {
        const existing = this._container.items[alias.toLowerCase()];
        if (existing) {
          existing.push(this);
        } else {
          this._container.items[alias.toLowerCase()] = [this];
        }
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
    this._addAliasesToContainer(this.aliases);
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
    this._addAliasesToContainer(this.aliases);
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

    this.uniqueItems.add(item);
    const existing = this.items[name];

    if (existing) {
      existing.push(item);
    } else {
      this.items[name] = [item];
    }

    item.container = this; // This causes the item's aliases to also be added to this item

    if (this.free > 0) {
      this.free -= item.size;
    }
  }

  /**
   * Remove an item from this item's collection
   * @param {*} item The item to remove
   * @param {*} alias (Optional) The item alias to remove
   */
  removeItem(item, alias) {
    // Use the alias provided or just the item's actual name
    const name = alias ? alias : item.name.toLowerCase();

    // Remove the item from the array of items with its name
    this.items[name] = this.items[name].filter(
      itemWithName => itemWithName !== item
    );

    // Remove the array if it's empty
    if (!this.items[name].length) {
      delete this.items[name];
    }

    if (this.uniqueItems.has(item)) {
      this.uniqueItems.delete(item);
      item.container = null;
      this.free += item.size;
    }

    // Remove aliases of the item if we're not already removing an alias
    if (!alias) {
      item.aliases.forEach(alias => {
        this.removeItem(item, alias);
      });
    }
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
    if (!this.itemsRevealed && this.container && this.itemsVisibleFromSelf) {
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

  get containerListing() {
    return this._containerListing;
  }

  set containerListing(listing) {
    this._containerListing = listing;
  }

  get items() {
    return this._items;
  }

  set items(items) {
    this._items = items;
    this.uniqueItems = new Set(
      ...Object.values(this._items).reduce((acc, itemsWithName) => {
        itemsWithName.forEach(item => acc.push(item));
        return acc;
      }, [])
    );
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
    return getBasicItemList(
      [...this.uniqueItems].filter(
        item => !item.containerListing && !item.doNotList
      )
    );
  }

  getFullDescription() {
    let description = this.description;

    if (this.itemsVisibleFromSelf) {
      if (Object.keys(this.items).length) {
        debug(`Items can be seen so adding them to ${this.name} description.`);
      }

      const heldItemsDescription = this.heldItemsDescription;

      if (heldItemsDescription.length) {
        description += `\n\n${heldItemsDescription}`;
      }
    } else if (Object.keys(this.items).length) {
      debug(
        `Items can't be seen so not including them in ${this.name} description.`
      );
    }

    return description;
  }

  get heldItemsDescription() {
    let description = "";
    const itemList = this.basicItemList;
    const uniqueItemList = [...this.uniqueItems];
    const containerListings = uniqueItemList
      .filter(item => item.containerListing)
      .map(item => item.containerListing);

    if (containerListings.length) {
      description += containerListings.join(" ");
    }

    if (itemList.length) {
      const prep = toTitleCase(this.preposition);
      const announceList =
        uniqueItemList.length < 8
          ? `there's ${itemList}.`
          : `you see:\n\n${itemList}`;
      description += description.length ? "\n\n" : "";
      description += `${prep} the ${this.name} ${announceList}`;
    }

    return description;
  }

  /*
   * Get items that are accesseible from this item. Includes items inside accessible containers
   * and this item itself.
   */
  get accessibleItems() {
    // Add this item, its aliases and the items it contains
    let items = {};

    // Copy our item arrays into this new object
    Object.keys(this.items).forEach(
      name => (items[name] = [...this.items[name]])
    );

    const itemsWithName = items[this.name.toLowerCase()];

    if (itemsWithName) {
      itemsWithName.push(this);
    } else {
      items[this.name.toLowerCase()] = [this];
    }

    this.aliases.forEach(alias => {
      const itemsWithName = items[alias.toLowerCase()];

      if (itemsWithName) {
        itemsWithName.push(this);
      } else {
        items[alias.toLowerCase()] = [this];
      }
    });

    // Add items inside this item's containers
    [...this.uniqueItems].forEach(item => {
      const newItems = item.accessibleItems;
      Object.entries(newItems).forEach(([name, itemsWithName]) => {
        if (items[name]) {
          // Add new items with this name to existing list (whilst deduping)
          itemsWithName.forEach(itemWithName => {
            if (!items[name].includes(itemWithName)) {
              items[name].push(itemWithName);
            }
          });
        } else {
          // Add a new entry
          items[name] = [...itemsWithName];
        }
      });
    });

    return items;
  }

  // Get a flat array of all of this item's items (including those with duplicate aliases)
  get itemArray() {
    return Object.values(this.items).reduce((acc, itemsWithName) => {
      itemsWithName.forEach(item => acc.push(item));
      return acc;
    }, []);
  }

  addAliases(...aliases) {
    const newAliases = aliases.forEach(alias => this.createAliases(alias));
    this._addAliasesToContainer(newAliases);
  }

  /*
   * Turns a multi-word alias into multiple single-word aliases (and adds the original too).
   * Ignores certain common words.
   */
  createAliases(alias) {
    let newAliases = [];
    const lcAlias = alias.toLowerCase();
    const aliases = lcAlias
      .split(/\s/)
      .filter(token => token.length)
      .filter(token => !this.aliases.some(word => word === token))
      .filter(token => !commonWords.some(word => word === token));

    // Only add if the alias has actually been split
    if (aliases[0] !== lcAlias) {
      newAliases = [...aliases];
    }

    if (lcAlias !== this.name.toLowerCase()) {
      newAliases.push(lcAlias);
    }

    this.aliases = [...this.aliases, ...newAliases];
    return newAliases;
  }
}
