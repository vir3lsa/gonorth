import { ManagedText, RandomText, Text } from "../interactions/text";
import { Verb } from "../verbs/verb";
import { createDynamicText } from "../../utils/dynamicDescription";
import {
  selectAllItemNames,
  selectInventory,
  selectItemNames,
  selectRecordChanges,
  selectRoom
} from "../../utils/selectors";
import { getBasicItemList, toTitleCase, getArticle } from "../../utils/textFunctions";
import { getStore } from "../../redux/storeRegistry";
import { addItem, itemsRevealed } from "../../redux/gameActions";
import { debug } from "../../utils/consoleIO";
import { commonWords } from "../constants";
import { moveItem } from "../../utils/itemFunctions";
import { playerHasItem } from "../../utils/sharedFunctions";

export function newItem(config: ItemConfig, typeConstructor = Item) {
  const { name, description, holdable, size, verbs, aliases, hidesItems, items, ...remainingConfig } = config;
  const item = new typeConstructor(name, description, holdable, size, verbs, aliases, hidesItems, config);
  Object.entries(remainingConfig).forEach(([key, value]) => (item[key] = value));

  item.addItems(...(items ?? []));

  // Run any verb modification functions.
  customiseVerbs(config.verbCustomisations, item);

  // Remove any unwanted aliases.
  omitAliases(config.omitAliases, item);

  return item;
}

export function customiseVerbs(verbModifications: VerbCustomisations = {}, item: Item) {
  Object.entries(verbModifications).forEach(([verbName, modifyFunction]) => {
    const verb = item.getVerb(verbName);
    modifyFunction(verb);
  });
}

export function omitAliases(aliases: string[] = [], item: Item) {
  item.aliases = item.aliases.filter((alias) => !aliases?.includes(alias));
}

export class Item {
  [property: string]: unknown;
  private _name!: string;
  private _description!: TextFunction;
  private _holdable!: boolean;
  private _size!: number;
  private _verbs!: VerbDict;
  private _verbList!: Verb | Verb[];
  private _aliases!: Set<string>;
  private _hidesItems!: ItemT[];
  private _container?: ItemT;
  private _itemsVisibleFromSelf!: boolean;
  private _capacity!: number;
  private _free!: number;
  private _takeSuccessText?: string;
  private _canHoldItems!: boolean;
  private _items!: ItemItemsDict;
  private _preposition!: string;
  private _properties!: ItemProperties;
  private _alteredProperties: Set<string>;
  private _article!: string;
  private _containerListing?: TextFunction;
  private _visible!: boolean;
  private _itemsVisibleFromRoom!: boolean;
  private _doNotList!: boolean;
  private _verbCustomisations: VerbCustomisations = {};
  private _config?: ItemConfig;
  private omitAliases: string[] = [];
  protected uniqueItems: Set<ItemT>;

  clone(typeConstructor = Item) {
    const copy = newItem(
      {
        name: `${this.name} copy`, // Have to add 'copy' to sidestep uniqueness check.
        description: this._description,
        holdable: this.holdable,
        size: this.size,
        verbs: this._verbList,
        aliases: [...this._aliases],
        omitAliases: this.omitAliases,
        hidesItems: this.hidesItems.map((item) => item.clone()),
        containerListing: this.containerListing,
        canHoldItems: this.canHoldItems,
        capacity: this.capacity,
        preposition: this.preposition,
        itemsVisibleFromRoom: this.itemsVisibleFromRoom,
        itemsVisibleFromSelf: this.itemsVisibleFromSelf,
        doNotList: this.doNotList,
        verbCustomisations: this.verbCustomisations || {},
        _cloned: true
      },
      typeConstructor
    );

    // Set the real name - okay for a clone because it won't be serialized.
    copy.name = this.name;

    // Remove unwanted aliases added due to our 'sidestep' above.
    copy.aliases = copy.aliases.filter(
      (alias) => alias !== copy.name && alias !== "copy" && !this.omitAliases.includes(alias)
    );

    return copy;
  }

  isRoom = false;

  constructor(
    name = "item",
    description: UnknownText = "It's fairly ordinary looking.",
    holdable = false,
    size = 1,
    verbs: VerbT | VerbBuilderT | (VerbT | VerbBuilderT)[] = [],
    aliases: string[] = [],
    hidesItems: (ItemT | Builder)[] = [],
    config?: ItemConfig
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
    this.container = undefined;
    this.verbList = verbs;
    this.hidesItems = hidesItems;
    this.items = {};
    this.uniqueItems = new Set();
    this.canHoldItems = false;
    this.capacity = -1;
    this.free = -1;
    this.preposition = "in";
    this.itemsVisibleFromRoom = false;
    this.itemsVisibleFromSelf = true;
    this.doNotList = false;
    this.properties = {};
    this.properNoun = "";
    this.config = config;

    aliases.forEach((alias) => this.createAliases(alias));

    this.addVerb(
      new Verb.Builder("examine")
        .withAliases("ex", "x", "look", "inspect")
        .withOnSuccess(
          ({ item }) => item.revealItems(),
          ({ item }) => item.getFullDescription()
        )
        .isRemote()
        .build()
    );

    this.addVerb(
      new Verb.Builder("combine")
        .withAliases("join", "meld", "insert")
        .makePrepositional("with what")
        .withSmartTest(
          false,
          ({ item, other }) => `You can't see a way to combine the ${item!.name} and the ${other!.name}.`
        )
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
          .withSmartTest(
            ({ item }) => item.container !== selectInventory(),
            ({ item }) => `You're already carrying ${item!.properNoun ? "" : "the "}${item!.name}!`
          )
          .withSmartTest(
            () => !config?.producesSingular || !playerHasItem(config.producesSingular),
            ({ item }) => `You've already got ${item!.article} ${config?.producesSingular!.name}.`
          )
          .withSmartTest(
            ({ item }) => Boolean(!item.container || item.container.itemsVisibleFromSelf),
            "You can't see that."
          )
          .withSmartTest(
            ({ item }) => Boolean(!item.container || item.container.open !== false),
            ({ item }) => `You can't get at it inside the ${item!.container!.name}.`
          )
          .withSmartTest(
            ({ item }) => {
              const inventory = selectInventory();
              const capacity = inventory.capacity;
              return capacity === -1 || (capacity > -1 && item.size <= capacity * 2);
            },
            ({ item }) => `The ${item!.name} ${this.isOrAre} far too large to pick up.`
          )
          .withSmartTest(
            ({ item }) => {
              const inventory = selectInventory();
              const capacity = inventory.capacity;
              return capacity === -1 || (capacity > -1 && item.size <= capacity);
            },
            ({ item }) => `The ${item!.name} ${this.isOrAre} too big to pick up.`
          )
          .withSmartTest(
            ({ item }) => {
              const inventory = selectInventory();
              const capacity = inventory.capacity;
              return capacity === -1 || (capacity > -1 && item.size <= inventory.free);
            },
            ({ item }) => `You don't have enough room for ${item!.properNoun ? "" : "the "}${item!.name}.`
          )
          .withOnSuccess(
            async (context) => {
              const container = context.item.container;
              const relinquish = container?.verbs["__relinquish"];
              const result = await relinquish?.attemptWithContext({ ...context, other: container });

              if (result === false) {
                // The relinquish verb failed - abort the take verb and print the result.
                context.abort!();
                return result;
              }
            },
            ({ item }) => {
              const container = item.container;
              moveItem(config?.producesSingular ?? item, selectInventory());

              // If we have custom success text, use it.
              if (this.takeSuccessText) {
                return this.takeSuccessText;
              }

              // Otherwise, if the item's in a room, take from there.
              if (container && !container.isRoom) {
                return takeFromContainerText.next(item, container);
              }

              // Else, take from generic container.
              return takeFromRoomText.next(item);
            }
          )
          .isRemote()
          .build()
      );

      const putVerb = new Verb.Builder("put")
        .withAliases("place", "add")
        .makePrepositional("where")
        .withSmartTest(
          ({ other }) => other !== this,
          ({ other }) =>
            `You can't put ${this.theOrNone} ${this.name} ${other!.preposition} ${
              config?.plural ? "themselves" : "itself"
            }. That would be nonsensical.`
        )
        .withSmartTest(
          ({ other }) => other!.canHoldItems,
          ({ other }) => `You can't put ${this.theOrNone} ${this.name} ${other!.preposition} the ${other!.name}.`
        )
        .withSmartTest(
          ({ other }) => other!.free === -1 || this.size <= other!.free,
          ({ other }) => `There's no room ${other!.preposition} the ${other!.name}.`
        )
        .withOnSuccess(
          ({ item, other }) => moveItem(item, other!),
          ({ item, other }) => {
            if (other!.isRoom) {
              return `You put ${item.theOrNone} ${item.name} on the floor.`;
            }

            return `You put ${item.theOrNone} ${item.name} ${other!.preposition} the ${other!.name}.`;
          }
        )
        .build();
      this.addVerb(putVerb);

      this.addVerb(
        new Verb.Builder("drop")
          .withAliases("discard", "put down")
          .makePrepositional("where", true)
          .withOnSuccess(
            ({ item, other, abort }) => {
              if (other) {
                abort!(); // Defer to put verb instead.
                return putVerb.attempt(item, other);
              }
            },
            ({ item }) => moveItem(item, selectRoom()),
            ({ item }) => `You put ${item.theOrNone} ${item.name} on the floor.`
          )
          .build()
      );

      this.addVerb(
        new Verb.Builder("give")
          .withSmartTest(
            ({ other }) => other !== this,
            () =>
              `You can't give ${this.theOrNone} ${this.name} to ${config?.plural ? "themselves" : "itself"}. Obviously.`
          )
          .withSmartTest(
            ({ other }) => Boolean(other!._isNpc),
            ({ other }) =>
              `You know you can't give ${this.theOrNone} ${this.name} to the ${other!.name}. So just stop it.`
          )
          .withSmartTest(
            () => false,
            ({ other }) => `It doesn't look like ${other!.name} wants ${this.theOrNone} ${this.name}.`
          )
          .withOnSuccess(({ item, other }) => moveItem(item, other!))
          .withAliases("offer", "pass", "show")
          .makePrepositional("to whom")
      );

      if (config?.producesSingular) {
        // Parent needs relevant verbs to pass onto the child.
        Object.values(config.producesSingular.verbs).forEach((verb) => {
          if (!this.verbs[verb.name] || !verb.remote) {
            const parentVerb = new Verb.Builder(verb.name)
              .withAliases(...verb.aliases)
              .isRemote()
              .withOnSuccess(
                ({ item }) => {
                  if (!verb.remote) {
                    return item.try("take");
                  }
                },
                (context) => verb.attemptWithContext({ ...context, item: config.producesSingular })
              );

            if (verb.prepositional) {
              parentVerb.makePrepositional(verb.interrogative!, verb.prepositionOptional);
            }

            this.addVerb(parentVerb);
          }
        });
      }
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
      this.article = article;
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

  set description(description: UnknownText) {
    this.recordAlteredProperty("description", description);
    this._description = createDynamicText(description);
  }

  addVerbs(...verbs: VerbT[]) {
    verbs.forEach((verb) => this.addVerb(verb));
  }

  addVerb(verbOrBuilder: VerbT | VerbBuilderT) {
    const verb = verbOrBuilder instanceof Verb.Builder ? verbOrBuilder.build() : verbOrBuilder;

    if (!Array.isArray(this._verbList)) {
      this._verbList = [this._verbList];
    }

    // Remove any existing instances of the verb.
    this._verbList = this._verbList.filter((existingVerb) => existingVerb.name !== verb.name);

    this._verbList.push(verb);
    this._verbs[verb.name.toLowerCase()] = verb;
    verb.parent = this;
  }

  getVerb(name: string) {
    const verb = this.verbs[name.toLowerCase()];

    if (!verb) {
      throw Error(`No verb with the name "${name}" exists on the item "${this.name}"`);
    }

    return verb;
  }

  _addAliasesToContainer(aliases: string[]) {
    if (this._container && aliases) {
      aliases.forEach((alias) => {
        const existing = this._container!.items[alias.toLowerCase()];
        if (existing) {
          existing.push(this);
        } else {
          this._container!.items[alias.toLowerCase()] = [this];
        }
      });
    }
  }

  get verbs() {
    return this._verbs;
  }

  set verbs(verbs) {
    this._verbs = verbs;
  }

  set verbList(verbs: Verb | VerbBuilderT | (Verb | VerbBuilderT)[]) {
    this._verbList = [];
    this._verbs = {};
    const verbArray = Array.isArray(verbs) ? verbs : [verbs];
    verbArray.forEach((verb) => this.addVerb(verb));
  }

  set container(container) {
    this.recordAlteredProperty("container", container);
    this._container = container;
    this._addAliasesToContainer(this.aliases);

    // If recordChanges is true, it indicates the game has started, so we'll reveal items when they move.
    if (selectRecordChanges() && container && !selectItemNames().has(this.name.toLowerCase())) {
      getStore().dispatch(itemsRevealed([this.name, ...this.aliases]));
    }
  }

  get container() {
    return this._container;
  }

  get aliases(): string[] {
    return this._aliases ? [...this._aliases] : [];
  }

  set aliases(aliases: string | string[]) {
    const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
    this.recordAlteredProperty("aliases", aliasArray);
    this._aliases = new Set(aliasArray);
    this._addAliasesToContainer(this.aliases);
  }

  /**
   * Attempt a verb.
   * @param verbName the verb to attempt
   * @param args to pass to the verb
   */
  async try(verbName: string, ...args: unknown[]) {
    const alias = verbName.toLowerCase();
    const verb = this.verbs[alias];

    if (verb) {
      return verb.attemptWithContext({ item: this, verb, alias }, ...args);
    }
  }

  addItems(...items: (ItemT | Builder)[]) {
    items.forEach((item) => this.addItem(item));
  }

  /**
   * Adds an item to this item's roster.
   * @param item The item to add.
   */
  addItem(itemOrBuilder: ItemT | Builder) {
    const item = itemOrBuilder instanceof Builder ? itemOrBuilder.build() : itemOrBuilder;

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
   * @param item The item to remove
   * @param alias (Optional) The item alias to remove
   */
  removeItem(item: ItemT, alias?: string) {
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
      item.container = undefined;

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

  set hidesItems(hidesItems: Item | Builder | (Item | Builder)[]) {
    const array = Array.isArray(hidesItems) ? hidesItems : [hidesItems];
    const hidesItemsArray = array.map((item) => (item instanceof Builder ? item.build() : item));
    this.recordAlteredProperty("hidesItems", hidesItemsArray);
    this._hidesItems = hidesItemsArray;
  }

  get hidesItems(): Item[] {
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
    return this._containerListing?.(this);
  }

  set containerListing(listing: UnknownText | undefined) {
    this.recordAlteredProperty("containerListing", listing);
    this._containerListing = listing ? createDynamicText(listing) : undefined;
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
    this._free = value;
  }

  get basicItemList() {
    return getBasicItemList(
      [...this.uniqueItems].filter((item) => item.holdable && !item.containerListing && !item.doNotList)
    );
  }

  getFullDescription(): UnknownText | ActionChainT {
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
    let items: ItemItemsDict = {};

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

  addAliases(...aliases: string[]) {
    const newAliases = aliases.flatMap((alias) => this.createAliases(alias));
    this._addAliasesToContainer(newAliases);
    getStore().dispatch(addItem(this)); // Use of Sets means doing this again not a problem.
  }

  /*
   * Turns a multi-word alias into multiple single-word aliases (and adds the original too).
   * Ignores certain common words.
   */
  createAliases(alias: string) {
    let newAliases: string[] = [];
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

  removeAliases(...aliases: string[]) {
    this.aliases = this.aliases.filter((alias) => !aliases.includes(alias));
  }

  _getActionChain(verbName: string, onFailure: boolean) {
    const verb = this.getVerb(verbName);
    return onFailure ? verb.onFailure : verb.onSuccess;
  }

  /*
   * Adds an action to the specified verb. By default, functions are added to the beginning of the chain of on-success actions and
   * anything else is added to the end.
   */
  addAction(verbName: string, action: ContextAction, onFailure: boolean, addToEnd: boolean) {
    const actionChain = this._getActionChain(verbName, onFailure);

    if (typeof addToEnd === "undefined") {
      addToEnd = typeof action !== "function";
    }

    if (addToEnd) {
      actionChain.addAction(action as Action);
    } else {
      actionChain.insertAction(action as Action);
    }
  }

  /*
   * Adds a postscript to the actions of the specified verb. By default, it's added to the on-success action chain.
   */
  addPostscript(verbName: string, text: PostScript, onFailure = false) {
    const actionChain = this._getActionChain(verbName, onFailure);
    actionChain.postScript = text;
  }

  /*
   * Adds a test to the specified verb.
   */
  addTest(verbName: string, test: Test) {
    const verb = this.getVerb(verbName);
    verb.addTest(test);
  }

  get isOrAre() {
    return this.config?.plural ? "are" : "is";
  }

  get theOrNone() {
    return this.properNoun ? "" : "the";
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

  get takeSuccessText() {
    return this._takeSuccessText;
  }

  set takeSuccessText(value) {
    this.recordAlteredProperty("takeSuccessText", value);
    this._takeSuccessText = value;
  }

  get verbCustomisations() {
    return this._verbCustomisations;
  }

  set verbCustomisations(value) {
    this._verbCustomisations = value;
  }

  get(property: string) {
    return this.properties[property];
  }

  set(property: string, value: Serializable) {
    if (typeof value === "function") {
      throw Error("Attempted to set a function as a property value. All item properties must be serializable.");
    }

    this.properties[property] = value;
    this.recordAlteredProperty("properties", this.properties);
  }

  get properties() {
    return this._properties;
  }

  set properties(value) {
    this.recordAlteredProperty("properties", value);
    this._properties = value;
  }

  get config() {
    return this._config;
  }

  set config(value) {
    this._config = value;
  }

  toJSON() {
    return [...this._alteredProperties]
      .map((propertyName): [string, Serializable] => {
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

        return [propertyName, propertyValue as Serializable];
      })
      .reduce((acc, [propertyName, propertyValue]) => {
        acc[propertyName] = propertyValue;
        return acc;
      }, {} as JsonDict);
  }

  // Records an altered property.
  recordAlteredProperty(propertyName: string, newValue?: Serializable | TextFunction) {
    if (this._cloned || !this._constructed) {
      // We won't serialize cloned objects, or objects constructed after recording began, so won't record their changes.
      return;
    }

    // If the new value being set is a Text, add an onChange callback so we know about internal changes.
    if (newValue instanceof Text || newValue instanceof ManagedText) {
      this._handleTextPropertyPersistence(propertyName, newValue);
    }

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

  get alteredProperties() {
    return this._alteredProperties;
  }

  _handleTextPropertyPersistence(propertyName: string, value: TextT | ManagedTextT) {
    value.onChange = () => this.recordAlteredProperty(propertyName);

    if (selectRecordChanges()) {
      value.recordAll();
    }
  }

  static get Builder() {
    return Builder;
  }
}

export class Builder {
  config: ItemConfig;

  constructor(name: string = "") {
    this.config = { name };
  }

  withName(name: string) {
    this.config.name = name;
    return this;
  }

  withDescription(description: UnknownText) {
    this.config.description = description;
    return this;
  }

  isHoldable(holdable = true) {
    this.config.holdable = holdable;
    return this;
  }

  withSize(size: number) {
    this.config.size = size;
    return this;
  }

  withVerb(verb: VerbT | VerbBuilderT) {
    if (!this.config.verbs) {
      this.config.verbs = [];
    }

    if (!Array.isArray(this.config.verbs)) {
      this.config.verbs = [this.config.verbs];
    }

    this.config.verbs!.push(verb);
    return this;
  }

  withVerbs(...verbs: (VerbT | VerbBuilderT)[]) {
    verbs.forEach((verb) => this.withVerb(verb));
    return this;
  }

  withAliases(...aliases: string[]) {
    this.config.aliases = aliases;
    return this;
  }

  omitAliases(...aliases: string[]) {
    this.config.omitAliases = aliases;
    return this;
  }

  hidesItems(...items: (ItemT | Builder)[]) {
    items.forEach((item) => this.hidesItem(item));
    return this;
  }

  hidesItem(item: ItemT | Builder) {
    if (!this.config.hidesItems) {
      this.config.hidesItems = [];
    }

    this.config.hidesItems.push(item);
    return this;
  }

  hasItems(...items: (ItemT | Builder)[]) {
    items.forEach((item) => this.hasItem(item));
    return this;
  }

  hasItem(item: ItemT | Builder) {
    if (!this.config.items) {
      this.config.items = [];
    }

    this.config.items.push(item);
    return this;
  }

  withContainerListing(containerListing: UnknownText) {
    this.config.containerListing = containerListing;
    return this;
  }

  withCapacity(capacity: number) {
    this.config.capacity = capacity;
    return this;
  }

  itemsVisibleFromSelf(visible = true) {
    this.config.itemsVisibleFromSelf = visible;
    return this;
  }

  itemsVisibleFromRoom(visible = true) {
    this.config.itemsVisibleFromRoom = visible;
    return this;
  }

  isDoNotList(doNotList = true) {
    this.config.doNotList = doNotList;
    return this;
  }

  withPreposition(preposition: string) {
    this.config.preposition = preposition;
    return this;
  }

  withArticle(article: string) {
    this.config.article = article;
    return this;
  }

  withTakeSuccessText(text: string) {
    this.config.takeSuccessText = text;
    return this;
  }

  hasParserPrecedence(hasPrecedence = true) {
    this.config.hasParserPrecedence = hasPrecedence;
    return this;
  }

  isManyAndProduces(item: Item | Builder) {
    this.config.producesSingular = item instanceof Builder ? item.build() : item;
    return this;
  }

  isPlural(plural = true) {
    this.config.plural = plural;
    return this;
  }

  withProperty(property: string, value: Serializable) {
    if (typeof value === "function") {
      throw Error("Attempted to set a function as a property value. All item properties must be serializable.");
    }

    if (!this.config.properties) {
      this.config.properties = {};
    }

    this.config.properties[property] = value;
    return this;
  }

  customiseVerb(verbName: string, customisation: (verb: Verb) => void) {
    if (!this.config.verbCustomisations) {
      this.config.verbCustomisations = {};
    }

    this.config.verbCustomisations[verbName] = customisation;
    return this;
  }

  build() {
    return newItem(this.config);
  }
}
