import { ManagedText, RandomText, Text } from "../interactions/text";
import { Verb } from "../verbs/verb";
import { createDynamicText } from "../../utils/dynamicDescription";
import { selectAllItemNames, selectInventory, selectRecordChanges } from "../../utils/selectors";
import { getBasicItemList, toTitleCase, getArticle } from "../../utils/textFunctions";
import { getStore } from "../../redux/storeRegistry";
import { addItem, itemsRevealed } from "../../redux/gameActions";
import { debug } from "../../utils/consoleIO";
import { commonWords } from "../constants";
import { moveItem } from "../../utils/itemFunctions";

export function newItem(config, typeConstructor = Item) {
  const { name, description, holdable, size, verbs, aliases, hidesItems, ...remainingConfig } = config;
  const item = new typeConstructor(name, description, holdable, size, verbs, aliases, hidesItems);
  Object.entries(remainingConfig).forEach(([key, value]) => (item[key] = value));

  return item;
}

export class Item {
  clone(typeConstructor) {
    const copy = newItem(
      {
        name: `${this.name} copy`, // Have to add 'copy' to sidestep uniqueness check.
        description: this._description,
        holdable: this.holdable,
        size: this.size,
        verbs: Object.values(this.verbs),
        aliases: this._aliases,
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

    // Remove unwanted aliases added due to our 'sidestep' above.
    copy.aliases = copy.aliases.filter((alias) => alias !== copy.name && alias !== "copy");

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
      new Verb.Builder("examine")
        .withAliases("ex", "x", "look", "inspect")
        .withTest(true)
        .withOnSuccess(
          ({ item }) => item.revealItems(),
          ({ item }) => item.getFullDescription()
        )
        .isRemote()
        .build()
    );

    const takeFromRoomText = new RandomText(
      (item) => `You take ${item.properNoun ? "" : "the "}${item.name}.`,
      (item) => `You pick up ${item.properNoun ? "" : "the "}${item.name}.`,
      (item) => `You grab ${item.properNoun ? "" : "the "}${item.name}.`
    );

    const takeFromContainerText = new RandomText(
      (item) => `You take ${item.properNoun ? "" : "the "}${item.name}.`,
      (item) => `You pick up ${item.properNoun ? "" : "the "}${item.name}.`,
      (item) => `You grab ${item.properNoun ? "" : "the "}${item.name}.`,
      (item, container) =>
        `You take ${item.properNoun ? "" : "the "}${item.name} from ${container.properNoun ? "" : "the "}${
          container.name
        }.`,
      (item, container) =>
        `You pick up ${item.properNoun ? "" : "the "}${item.name} from ${container.properNoun ? "" : "the "}${
          container.name
        }.`,
      (item, container) =>
        `You grab ${item.properNoun ? "" : "the "}${item.name} from ${container.properNoun ? "" : "the "}${
          container.name
        }.`
    );

    if (this.holdable) {
      this.addVerb(
        new Verb.Builder("take")
          .withAliases("pick up", "steal", "grab", "hold")
          .withTest(({ item }) => {
            const inventory = selectInventory();
            let containerTest = true;

            if (item.container) {
              containerTest =
                item.container.itemsVisibleFromSelf && item.container.open !== false && item.container !== inventory;
            }

            return containerTest && (inventory.capacity === -1 || item.size <= inventory.free);
          })
          .withOnSuccess(({ item }) => {
            const container = item.container;
            moveItem(item, selectInventory());

            if (container && !container.isRoom) {
              return takeFromContainerText.next(item, container);
            }

            return takeFromRoomText.next(item);
          })
          .withOnFailure(({ item }) => {
            const article = item.properNoun ? "" : "the ";
            const inventory = selectInventory();
            if (!item.container.itemsVisibleFromSelf) {
              return "You can't see that.";
            } else if (item.container.open === false) {
              return `You can't get at it inside the ${item.container.name}.`;
            } else if (item.container !== inventory && inventory.capacity > -1 && item.size > inventory.capacity * 2) {
              return `The ${item.name} is far too large to pick up.`;
            } else if (item.container !== inventory && inventory.capacity > -1 && item.size > inventory.capacity) {
              return `The ${item.name} is too big to pick up.`;
            } else if (item.container !== inventory && inventory.capacity > -1 && item.size > inventory.free) {
              return `You don't have enough room for ${article}${item.name}.`;
            } else if (item.container === inventory) {
              return `You're already carrying ${article}${item.name}!`;
            }
          })
          .isRemote()
          .build()
      );

      const putVerb = new Verb(
        "put",
        ({ item, other }) => other !== item && other.canHoldItems && (other.free === -1 || item.size <= other.free),
        [
          ({ item, other }) => moveItem(item, other),
          ({ item, other }) => {
            const article = item.properNoun ? "" : "the ";
            return `You put ${article}${item.name} ${other.preposition} the ${other.name}.`;
          }
        ],
        ({ item, other }) => {
          const article = item.properNoun ? "" : "the ";
          if (other === this) {
            return `You can't put ${article}${item.name} ${other.preposition} itself. That would be nonsensical.`;
          } else if (other.canHoldItems) {
            return `There's no room ${other.preposition} the ${other.name}.`;
          } else {
            return `You can't put ${article}${item.name} ${other.preposition} the ${other.name}.`;
          }
        },
        ["place", "drop", "add"]
      );

      putVerb.makePrepositional("where");
      this.addVerb(putVerb);

      // Give always fails - override for special cases
      const giveVerb = new Verb(
        "give",
        () => false,
        ({ item, other }) => moveItem(item, other),
        ({ item, other }) => {
          const article = item.properNoun ? "" : "the ";
          if (other === item) {
            return `You can't give ${article}${item.name} to itself. Obviously.`;
          } else if (other._isNpc) {
            return `It doesn't look like ${other.name} wants ${article}${item.name}.`;
          } else {
            return `You know you can't give ${article}${item.name} to the ${other.name}. So just stop it.`;
          }
        },
        ["offer", "pass", "show"]
      );

      giveVerb.makePrepositional("to whom");
      this.addVerb(giveVerb);
    }

    this._constructed = true; // Indicate construction has completed.
    getStore().dispatch(addItem(this));
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this.recordAlteredProperty("name", name);
    this._name = name;

    const article = getArticle(name);

    if (article !== this.article) {
      this.article = getArticle(name);
    }

    this.createAliases(name);
  }

  get article() {
    return this._article;
  }

  set article(value) {
    this.recordAlteredProperty("article", value);
    this._article = value;
  }

  get description() {
    return this._description ? this._description(this) : "";
  }

  /**
   * @param {string | string[] | function | Text | undefined } description
   */
  set description(description) {
    this.recordAlteredProperty("description", description);
    this._description = createDynamicText(description);
  }

  addVerbs(...verbs) {
    verbs.forEach((verb) => this.addVerb(verb));
  }

  addVerb(verb) {
    if (verb instanceof Verb.Builder) {
      throw Error(`Tried to add a verb to ${this.name} but received a Builder. Did you forget to call build()?`);
    }

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
    this.recordAlteredProperty("container", container);
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
    this.recordAlteredProperty("aliases", aliasArray);
    this._aliases = new Set(aliasArray);
    this._addAliasesToContainer(this.aliases);
  }

  /**
   * Attempt a verb.
   * @param {string} verbName
   * @param  {...any} args to pass to the verb
   */
  async try(verbName, ...args) {
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
    if (item instanceof Item.Builder) {
      throw Error(`Tried to add an item to ${this.name} but received a Builder. Did you forget to call build()?`);
    }

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

    if (this.free > -1) {
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

      if (this.free > -1) {
        this.free += item.size;
      }
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
    this.recordAlteredProperty("hidesItems", hidesItemsArray);
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

      getStore().dispatch(itemsRevealed(this.hidesItems.flatMap((item) => [item.name, ...item.aliases])));

      if (this.hidesItems.length) {
        this.hidesItems = [];
      }
    }
  }

  get containerListing() {
    return this._containerListing;
  }

  set containerListing(listing) {
    this.recordAlteredProperty("containerListing", listing);
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
    this.recordAlteredProperty("capacity", capacity);
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
    this.recordAlteredProperty("free", value);
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

  removeAliases(...aliases) {
    this.aliases = this.aliases.filter((alias) => !aliases.includes(alias));
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
    this.recordAlteredProperty("holdable", value);
    this._holdable = value;
  }

  get size() {
    return this._size;
  }

  set size(value) {
    this.recordAlteredProperty("size", value);
    this._size = value;
  }

  get visible() {
    return this._visible;
  }

  set visible(value) {
    this.recordAlteredProperty("visible", value);
    this._visible = value;
  }

  get canHoldItems() {
    return this._canHoldItems;
  }

  set canHoldItems(value) {
    this.recordAlteredProperty("canHoldItems", value);
    this._canHoldItems = value;
  }

  get preposition() {
    return this._preposition;
  }

  set preposition(value) {
    this.recordAlteredProperty("preposition", value);
    this._preposition = value;
  }

  get itemsVisibleFromSelf() {
    return this._itemsVisibleFromSelf;
  }

  set itemsVisibleFromSelf(value) {
    this.recordAlteredProperty("itemsVisibleFromSelf", value);
    this._itemsVisibleFromSelf = value;
  }

  get itemsVisibleFromRoom() {
    return this._itemsVisibleFromRoom;
  }

  set itemsVisibleFromRoom(value) {
    this.recordAlteredProperty("itemsVisibleFromRoom", value);
    this._itemsVisibleFromRoom = value;
  }

  get doNotList() {
    return this._doNotList;
  }

  set doNotList(value) {
    this.recordAlteredProperty("doNotList", value);
    this._doNotList = value;
  }

  toJSON() {
    return [...this._alteredProperties]
      .map((propertyName) => {
        const propertyValue = this[propertyName];

        if (typeof propertyValue === "function") {
          throw Error(
            `Attempted to serialize property ${propertyName} of "${this.name}" when saving game, but the property is a function. Changing properties to functions at runtime is not supported as functions can't be serialized.`
          );
        } else if (propertyValue instanceof Item) {
          return [propertyName, { name: propertyValue.name, isItem: true }];
        } else if (Array.isArray(propertyValue)) {
          const sanitisedArray = propertyValue.map((entry) =>
            entry instanceof Item ? { name: entry.name, isItem: true } : entry
          );
          return [propertyName, sanitisedArray];
        }

        return [propertyName, propertyValue];
      })
      .reduce((acc, [propertyName, propertyValue]) => {
        acc[propertyName] = propertyValue;
        return acc;
      }, {});
  }

  // Records an altered property.
  recordAlteredProperty(propertyName, newValue) {
    if (this._cloned || !this._constructed) {
      // We won't serialize cloned objects, or objects constructed after recording began, so won't record their changes.
      return;
    }

    // If the new value being set is a Text, add an onChange callback so we know about internal changes.
    this._handleTextPropertyPersistence(propertyName, newValue);

    const recordChanges = selectRecordChanges();
    if (recordChanges && typeof newValue === "function") {
      throw Error(
        `Updated item property "${propertyName}" to a function. This is non-serializable and hence can't be recorded into the save file.`
      );
    }

    if (recordChanges) {
      this._alteredProperties.add(propertyName);
    }
  }

  _handleTextPropertyPersistence(propertyName, value) {
    if (value instanceof Text || value instanceof ManagedText) {
      value.onChange = () => this.recordAlteredProperty(propertyName);

      if (selectRecordChanges()) {
        value.recordAll();
      }
    }
  }

  static get Builder() {
    return Builder;
  }
}

export class Builder {
  constructor(name) {
    this.config = { name };
  }

  withName(name) {
    this.config.name = name;
    return this;
  }

  withDescription(description) {
    this.config.description = description;
    return this;
  }

  isHoldable(holdable = true) {
    this.config.holdable = holdable;
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

  withContainerListing(containerListing) {
    this.config.containerListing = containerListing;
    return this;
  }

  withCapacity(capacity) {
    this.config.capacity = capacity;
    return this;
  }

  isDoNotList(doNotList = true) {
    this.config.doNotList = doNotList;
    return this;
  }

  withPreposition(preposition) {
    this.config.preposition = preposition;
    return this;
  }

  withArticle(article) {
    this.config.article = article;
    return this;
  }

  build() {
    return newItem(this.config);
  }
}
