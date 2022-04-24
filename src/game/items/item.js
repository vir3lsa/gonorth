import { RandomText, Text } from "../interactions/text";
import { Verb } from "../verbs/verb";
import { createDynamicText } from "../../utils/dynamicDescription";
import { selectAllItemNames, selectInventory } from "../../utils/selectors";
import { getBasicItemList, toTitleCase, getArticle } from "../../utils/textFunctions";
import { getStore } from "../../redux/storeRegistry";
import { addItem, itemsRevealed } from "../../redux/gameActions";
import { debug } from "../../utils/consoleIO";
import { commonWords } from "../constants";

export function newItem(config, typeConstructor = Item) {
  const { name, description, holdable, size, verbs, aliases, hidesItems, ...remainingConfig } = config;
  const item = new typeConstructor(name, description, holdable, size, verbs, aliases, hidesItems);

  // Set remaining properties on the new item without recording the changes, then mark it for recording again.
  item.recordChanges = false;
  Object.entries(remainingConfig).forEach(([key, value]) => (item[key] = value));
  item.recordChanges = true;

  return item;
}

export class Item {
  clone(typeConstructor) {
    const copy = newItem(
      {
        name: `${this.name} copy`, // Have to add 'copy' to sidestep uniqueness check.
        description: this.description,
        holdable: this.holdable,
        size: this.size,
        verbs: Object.values(this.verbs),
        aliases: this.aliases,
        hidesItems: this.hidesItems.map((item) => item.clone()),
        containerListing: this.containerListing,
        canHoldItems: this.canHoldItems,
        capacity: this.capacity,
        preposition: this.preposition,
        itemsVisibleFromRoom: this.itemsVisibleFromRoom,
        itemsVisibleFromSelf: this.itemsVisibleFromSelf,
        doNotList: this.doNotList,
        _cloned: true
      },
      typeConstructor
    );

    // Set the real name - okay for a clone because it won't be serialized.
    copy.name = this.name;
    return copy;
  }

  constructor(
    name = "item",
    description = "It's fairly ordinary looking.",
    holdable = false,
    size = 1,
    verbs = [],
    aliases = [],
    hidesItems = []
  ) {
    if (selectAllItemNames().has(name)) {
      throw Error(
        `Tried to create an item with name "${name}" but an item with that name already exists. Names must be unique - consider making "${name}" an alias instead.`
      );
    }

    this._alteredProperties = new Set();
    this._type = "Item";
    this.aliases = [];
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

    aliases.forEach((alias) => this.createAliases(alias));

    this.addVerb(
      new Verb("examine", true, [() => this.revealItems(), () => this.getFullDescription()], null, [
        "ex",
        "x",
        "look",
        "inspect"
      ])
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
              (inventory.capacity === -1 || this.size <= inventory.free)
            );
          },
          [
            () => {
              this.container.removeItem(this);
              selectInventory().addItem(this);
              this.containerListing = null;
            },
            () => {
              const article = this.properNoun ? "" : "the ";
              return new RandomText(
                `You take ${article}${this.name}.`,
                `You pick up ${article}${this.name}.`,
                `You grab ${article}${this.name}.`
              );
            }
          ],
          () => {
            const article = this.properNoun ? "" : "the ";
            const inventory = selectInventory();
            if (!this.container.itemsVisibleFromSelf) {
              return "You can't see that.";
            } else if (this.container !== inventory && inventory.capacity > -1 && this.size > inventory.free) {
              return `You don't have enough room for ${article}${this.name}.`;
            } else if (this.container === inventory) {
              return `You're already carrying ${article}${this.name}!`;
            }
          },
          ["pick up", "steal", "grab", "hold"]
        )
      );

      const putVerb = new Verb(
        "put",
        (helper, item, other) => other !== this && other.canHoldItems && (other.free === -1 || this.size <= other.free),
        [
          (helper, item, other) => {
            this.containerListing = null;
            this.container.removeItem(this);
            return other.addItem(this);
          },
          (helper, item, other) => {
            const article = this.properNoun ? "" : "the ";
            return `You put ${article}${this.name} ${other.preposition} the ${other.name}.`;
          }
        ],
        (helper, item, other) => {
          const article = this.properNoun ? "" : "the ";
          if (other === this) {
            return `You can't put ${article}${this.name} ${other.preposition} itself. That would be nonsensical.`;
          } else if (other.canHoldItems) {
            return `There's no room ${other.preposition} the ${other.name}.`;
          } else {
            return `You can't put ${article}${this.name} ${other.preposition} the ${other.name}.`;
          }
        },
        ["place", "drop"]
      );

      putVerb.makePrepositional("where");
      this.addVerb(putVerb);

      // Give always fails - override for special cases
      const giveVerb = new Verb(
        "give",
        () => false,
        (helper, item, other) => {
          this.containerListing = null;
          this.container.removeItem(this);
          return other.addItem(this);
        },
        (helper, item, other) => {
          const article = this.properNoun ? "" : "the ";
          if (other === this) {
            return `You can't give ${article}${this.name} to itself. Obviously.`;
          } else if (other.isNpc) {
            return `It doesn't look like ${other.name} wants ${article}${this.name}.`;
          } else {
            return `You know you can't give ${article}${this.name} to the ${other.name}. So just stop it.`;
          }
        },
        ["offer", "pass", "show"]
      );

      giveVerb.makePrepositional("to whom");
      this.addVerb(giveVerb);
    }

    // Record changes from now on.
    this.recordChanges = true;
    getStore().dispatch(addItem(this));
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._recordAlteredProperty("name", name);
    this._name = name;
    this.article = getArticle(name);
    this.createAliases(name);
  }

  get description() {
    return this._description ? this._description(this) : "";
  }

  /**
   * @param {string | string[] | function | Text | undefined } description
   */
  set description(description) {
    this._recordAlteredProperty("description", description);
    this._description = createDynamicText(description);
  }

  addVerbs(...verbs) {
    verbs.forEach((verb) => this.addVerb(verb));
  }

  addVerb(verb) {
    this._verbs[verb.name.toLowerCase()] = verb;
    verb.parent = this;
  }

  get verbs() {
    return this._verbs;
  }

  getVerb(name) {
    const verb = this.verbs[name.toLowerCase()];

    if (!verb) {
      throw Error(`No verb with the name "${name}" exists on the item "${this.name}"`);
    }

    return verb;
  }

  _addAliasesToContainer(aliases) {
    if (this._container && aliases) {
      aliases.forEach((alias) => {
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
    verbArray.forEach((verb) => this.addVerb(verb));
  }

  /**
   * @param {Item} container
   */
  set container(container) {
    this._recordAlteredProperty("container", container);
    this._container = container;
    this._addAliasesToContainer(this.aliases);
  }

  get container() {
    return this._container;
  }

  get aliases() {
    return this._aliases ? [...this._aliases] : [];
  }

  /**
   * @param {string | string[]} aliases
   */
  set aliases(aliases) {
    const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
    this._recordAlteredProperty("aliases", aliasArray);
    this._aliases = new Set(aliasArray);
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
      return verb.attempt(this, ...args);
    }
  }

  addItems(...items) {
    items.forEach((item) => this.addItem(item));
  }

  /**
   * Adds an item to this item's roster.
   * @param {Item} item The item to add.
   */
  addItem(item) {
    if (this.uniqueItems.has(item)) {
      debug(`Not adding ${item.name} to ${this.name} as it's already present.`);
      return;
    }

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
    this.items[name] = this.items[name].filter((itemWithName) => itemWithName !== item);

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
      item.aliases.forEach((alias) => {
        this.removeItem(item, alias);
      });
    }
  }

  set hidesItems(hidesItems) {
    const hidesItemsArray = Array.isArray(hidesItems) ? hidesItems : [hidesItems];
    this._recordAlteredProperty("hidesItems", hidesItemsArray);
    this._hidesItems = hidesItemsArray;
  }

  get hidesItems() {
    return this._hidesItems;
  }

  /**
   * Adds items this item hides to self.
   */
  revealItems() {
    if (this.itemsVisibleFromSelf) {
      debug(`${this.name}: Revealing items`);

      this.hidesItems.forEach((item) => {
        debug(`${this.name}: Adding item ${item.name} to self`);
        this.addItem(item);
      });

      getStore().dispatch(itemsRevealed(this.hidesItems.map((item) => item.name)));

      this.hidesItems = [];
    }
  }

  get containerListing() {
    return this._containerListing;
  }

  set containerListing(listing) {
    this._recordAlteredProperty("containerListing", listing);
    this._containerListing = listing;
  }

  get items() {
    return this._items;
  }

  set items(items) {
    this._items = items;
    this.uniqueItems = new Set(
      Object.values(this._items).reduce((acc, itemsWithName) => {
        itemsWithName.forEach((item) => acc.push(item));
        return acc;
      }, [])
    );
  }

  get capacity() {
    return this._capacity;
  }

  set capacity(capacity) {
    this._recordAlteredProperty("capacity", capacity);
    this._capacity = capacity;
    this.free = capacity;

    if (capacity > 0 && !this.canHoldItems) {
      this.canHoldItems = true;
    }
  }

  get free() {
    return this._free;
  }

  set free(value) {
    this._recordAlteredProperty("free", value);
    this._free = value;
  }

  get basicItemList() {
    return getBasicItemList(
      [...this.uniqueItems].filter((item) => item.holdable && !item.containerListing && !item.doNotList)
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
      debug(`Items can't be seen so not including them in ${this.name} description.`);
    }

    return description;
  }

  get heldItemsDescription() {
    let description = "";
    const itemList = this.basicItemList;
    const uniqueItemList = [...this.uniqueItems];
    const containerListings = uniqueItemList
      .filter((item) => item.containerListing)
      .map((item) => item.containerListing);

    if (containerListings.length) {
      description += containerListings.join("\n\n");
    }

    if (itemList.length) {
      const prep = toTitleCase(this.preposition);
      const announceList = uniqueItemList.length < 8 ? `there's ${itemList}.` : `you see:\n\n${itemList}`;
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

    if (this.itemsVisibleFromSelf) {
      // Copy our item arrays into this new object
      Object.keys(this.items).forEach((name) => (items[name] = [...this.items[name]]));
    }

    const itemsWithName = items[this.name.toLowerCase()];

    if (itemsWithName) {
      itemsWithName.push(this);
    } else {
      items[this.name.toLowerCase()] = [this];
    }

    this.aliases.forEach((alias) => {
      const itemsWithName = items[alias.toLowerCase()];

      if (itemsWithName) {
        itemsWithName.push(this);
      } else {
        items[alias.toLowerCase()] = [this];
      }
    });

    if (this.itemsVisibleFromSelf) {
      // Add items inside this item's containers
      [...this.uniqueItems].forEach((item) => {
        const newItems = item.accessibleItems;
        Object.entries(newItems).forEach(([name, itemsWithName]) => {
          if (items[name]) {
            // Add new items with this name to existing list (whilst deduping)
            itemsWithName.forEach((itemWithName) => {
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
    }

    return items;
  }

  // Get a flat array of all of this item's items (including those with duplicate aliases)
  get itemArray() {
    return Object.values(this.items).reduce((acc, itemsWithName) => {
      itemsWithName.forEach((item) => acc.push(item));
      return acc;
    }, []);
  }

  addAliases(...aliases) {
    const newAliases = aliases.forEach((alias) => this.createAliases(alias));
    this._addAliasesToContainer(newAliases);
    getStore().dispatch(addItem(this)); // Use of Sets means doing this again not a problem.
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
      .filter((token) => token.length)
      .filter((token) => !this.aliases.some((word) => word === token))
      .filter((token) => !commonWords.some((word) => word === token));

    // Only add if the alias has actually been split
    if (aliases[0] !== lcAlias) {
      newAliases = [...aliases];
    }

    if (lcAlias !== this.name.toLowerCase()) {
      newAliases.push(lcAlias);
    }

    if (newAliases.length) {
      this.aliases = [...this.aliases, ...newAliases];
    }

    return newAliases;
  }

  _getActionChain(verbName, onFailure) {
    const verb = this.getVerb(verbName);
    return onFailure ? verb.onFailure : verb.onSuccess;
  }

  /*
   * Adds an action to the specified verb. By default, functions are added to the beginning of the chain of on-success actions and
   * anything else is added to the end.
   */
  addAction(verbName, action, onFailure, addToEnd) {
    const actionChain = this._getActionChain(verbName, onFailure);

    if (typeof addToEnd === "undefined") {
      addToEnd = typeof action !== "function";
    }

    if (addToEnd) {
      actionChain.addAction(action);
    } else {
      actionChain.insertAction(action);
    }
  }

  /*
   * Adds a postscript to the actions of the specified verb. By default, it's added to the on-success action chain.
   */
  addPostscript(verbName, text, onFailure = false) {
    const actionChain = this._getActionChain(verbName, onFailure);
    actionChain.postScript = text;
  }

  /*
   * Adds a test to the specified verb.
   */
  addTest(verbName, test) {
    const verb = this.getVerb(verbName);
    verb.addTest(test);
  }

  get holdable() {
    return this._holdable;
  }

  set holdable(value) {
    this._recordAlteredProperty("holdable", value);
    this._holdable = value;
  }

  get size() {
    return this._size;
  }

  set size(value) {
    this._recordAlteredProperty("size", value);
    this._size = value;
  }

  get visible() {
    return this._visible;
  }

  set visible(value) {
    this._recordAlteredProperty("visible", value);
    this._visible = value;
  }

  get canHoldItems() {
    return this._canHoldItems;
  }

  set canHoldItems(value) {
    this._recordAlteredProperty("canHoldItems", value);
    this._canHoldItems = value;
  }

  get preposition() {
    return this._preposition;
  }

  set preposition(value) {
    this._recordAlteredProperty("preposition", value);
    this._preposition = value;
  }

  get itemsVisibleFromSelf() {
    return this._itemsVisibleFromSelf;
  }

  set itemsVisibleFromSelf(value) {
    this._recordAlteredProperty("itemsVisibleFromSelf", value);
    this._itemsVisibleFromSelf = value;
  }

  get itemsVisibleFromRoom() {
    return this._itemsVisibleFromRoom;
  }

  set itemsVisibleFromRoom(value) {
    this._recordAlteredProperty("itemsVisibleFromRoom", value);
    this._itemsVisibleFromRoom = value;
  }

  get doNotList() {
    return this._doNotList;
  }

  set doNotList(value) {
    this._recordAlteredProperty("doNotList", value);
    this._doNotList = value;
  }

  // Records an altered property, if it has changed.
  _recordAlteredProperty(propertyName, newValue) {
    if (this._cloned) {
      // We won't serialize cloned objects, so won't record their changes.
      return;
    }
    
    if (this.recordChanges && typeof newValue === "function") {
      throw Error(
        `Updated item property "${propertyName}" to a function. This is non-serializable and hence can't be recorded into the save file.`
      );
    }

    if (this.recordChanges) {
      this._alteredProperties.add(propertyName);
    }
  }

  static get Builder() {
    class Builder {
      constructor() {
        this.config = {};
      }

      withName(name) {
        this.config.name = name;
        return this;
      }

      withDescription(description) {
        this.config.description = description;
        return this;
      }

      makeHoldable() {
        this.config.holdable = true;
        return this;
      }

      withSize(size) {
        this.config.size = size;
        return this;
      }

      withVerbs(...verbs) {
        this.config.verbs = verbs;
        return this;
      }

      withAliases(...aliases) {
        this.config.aliases = aliases;
        return this;
      }

      hidesItems(...items) {
        this.config.hidesItems = items;
        return this;
      }

      build() {
        return newItem(this.config);
      }
    }

    return Builder;
  }
}
