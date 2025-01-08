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
import { playerHasItem, resolveItem } from "../../utils/sharedFunctions";
import { ActionClass } from "../../utils/actionChain";

export function customiseVerbs(verbModifications: VerbCustomisations = {}, item: Item) {
  Object.entries(verbModifications).forEach(([verbName, modifyFunction]) => {
    const verb = item.getVerb(verbName);
    modifyFunction(verb);
  });
}

/**
 * An Item is a thing the player can interact with. It can be given {@link game/verbs/verb!Verb | Verbs} to define what interactions may occur.
 * A number of {@link game/verbs/verb!Verb | Verbs} are given automatically:
 * - `examine`
 * - `combine`
 *
 * Several more {@link game/verbs/verb!Verb | Verbs} are added if the Item is `holdable`:
 * - `take`
 * - `put`
 * - `drop`
 * - `give`
 *
 * Items are constructed using a builder:
 *
 * ```ts
 * const spade = new Item.Builder("spade")
 *   .withAliases("shovel", "trowel")
 *   .withDescription("A shiny metal shovel with a bright red handle.")
 *   .withVerb(dig)
 *   .build();
 * ```
 */
export class Item {
  [property: string]: unknown;
  private __name!: string;
  private __description: TextFunction = () => "It's fairly ordinary looking.";
  private __holdable: boolean = false;
  private __size: number = 1;
  private __verbs: VerbDict = {};
  private __verbList: Verb | Verb[] = [];
  private __aliases: Set<string> = new Set<string>();
  private __hidesItems: ItemT[] = [];
  private __container?: ItemT;
  private __itemsVisibleFromSelf!: boolean;
  private __capacity!: number;
  private __free!: number;
  private __onTake?: Action;
  private __canHoldItems!: boolean;
  private __items!: ItemItemsDict;
  private __preposition!: string;
  private __properties!: ItemProperties;
  private __alteredProperties: Set<string>;
  private __article!: string;
  private __containerListing?: TextFunction;
  private __visible!: boolean;
  private __itemsVisibleFromRoom!: boolean;
  private __doNotList!: boolean;
  private __properNoun!: boolean;
  private __verbCustomisations: VerbCustomisations = {};
  private __config?: ItemConfig;
  private __omitAliases: string[] = [];
  protected uniqueItems: Set<ItemT>;
  isRoom = false;

  clone(typeConstructor = Item) {
    const builder = new Item.Builder();

    builder.config = {
      name: `${this.name} copy`, // Have to add 'copy' to sidestep uniqueness check.
      description: this.__description,
      holdable: this.holdable,
      size: this.size,
      verbs: this.__verbList,
      aliases: [...this.__aliases],
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
    };

    const copy = new typeConstructor(undefined, undefined, false, 0, undefined, undefined, undefined, builder);

    // Set the real name - okay for a clone because it won't be serialized.
    copy.name = this.name;

    // Remove unwanted aliases added due to our 'sidestep' above.
    copy.aliases = copy.aliases.filter(
      (alias) => alias !== copy.name && alias !== "copy" && !this.omitAliases.includes(alias)
    );

    return copy;
  }

  constructor(
    name?: string,
    description: UnknownText = "It's fairly ordinary looking.",
    holdable = false,
    size = 1,
    verbs: VerbT | VerbBuilderT | (VerbT | VerbBuilderT)[] = [],
    aliases: string[] = [],
    hidesItems: (ItemT | Builder)[] = [],
    builder?: Builder
  ) {
    const config = builder?.config;
    this.config = config;

    if (!name && !config?.name) {
      throw Error("Tried to create an Item without a name. All Items must have names.");
    }

    this.__alteredProperties = new Set();
    this.aliases = [];
    this.name = name ?? config?.name ?? "item";

    if (selectAllItemNames().has(this.name)) {
      throw Error(
        `Tried to create an item with name "${this.name}" but an item with that name already exists. Names must be unique - consider making "${this.name}" an alias instead.`
      );
    }

    this.visible = true;
    this.container = undefined;
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
    this.properNoun = false;
    this.verbList = verbs || [];

    if (config) {
      const { aliases, verbs, items, ...remainingConfig } = config;

      this.verbList = verbs || [];

      Object.entries(remainingConfig)
        .filter(([key]) => key !== "name")
        .forEach(([key, value]) => (this[key] = value));
      aliases?.forEach((alias) => this.createAliases(alias));
      this.addItems(...(config.items ?? []));
    } else {
      this.description = description;
      this.holdable = holdable;
      this.size = size;
      this.verbList = verbs;
      this.hidesItems = hidesItems;

      aliases.forEach((alias) => this.createAliases(alias));
    }

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
            new ActionClass(
              this.onTake ??
                (({ item }) => {
                  const container = item!.container;

                  // Take from generic container.
                  if (container && !container.isRoom) {
                    return takeFromContainerText.next(item, container);
                  }

                  // Otherwise, if the item's in a room, take from there.
                  return takeFromRoomText.next(item);
                }),
              false
            ),
            ({ item }) => moveItem(config?.producesSingular ?? item, selectInventory())
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
            `You can't put ${this.theOrNone + this.name} ${other!.preposition} ${
              config?.plural ? "themselves" : "itself"
            }. That would be nonsensical.`
        )
        .withSmartTest(
          ({ other }) => other!.canHoldItems,
          ({ other }) =>
            `You can't put ${this.theOrNone + this.name} ${other!.preposition} ${other!.theOrNone + other!.name}.`
        )
        .withSmartTest(
          ({ other }) => other!.open !== false,
          ({ other }) =>
            `You can't put ${this.theOrNone + this.name} ${other!.preposition} ${
              other!.theOrNone + other!.name
            } because ${other!.theOrNone + other!.name} ${other!.isOrAre} closed.`
        )
        .withSmartTest(
          ({ other }) => other!.free === -1 || this.size <= other!.free,
          ({ other }) => `There's no room ${other!.preposition} the ${other!.name}.`
        )
        .withOnSuccess(
          ({ item, other }) => moveItem(item, other!),
          ({ item, other }) => {
            if (other!.isRoom) {
              return `You put ${item.theOrNone + item.name} on the floor.`;
            }

            return `You put ${item.theOrNone + item.name} ${other!.preposition} the ${other!.name}.`;
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
            ({ item }) => `You put ${item.theOrNone + item.name} on the floor.`
          )
          .build()
      );

      this.addVerb(
        new Verb.Builder("give")
          .withSmartTest(
            ({ other }) => other !== this,
            () =>
              `You can't give ${this.theOrNone + this.name} to ${config?.plural ? "themselves" : "itself"}. Obviously.`
          )
          .withSmartTest(
            ({ other }) => Boolean(other!._isNpc),
            ({ other }) =>
              `You know you can't give ${this.theOrNone + this.name} to the ${other!.name}. So just stop it.`
          )
          .withSmartTest(
            () => false,
            ({ other }) => `It doesn't look like ${other!.name} wants ${this.theOrNone + this.name}.`
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

    this.customiseVerbs(Item.name);

    this.__constructed = true; // Indicate construction has completed.
    getStore().dispatch(addItem(this));
  }

  protected customiseVerbs(calledFrom: string) {
    if (this.config && this.constructor.name === calledFrom) {
      // Run any verb modification functions.
      customiseVerbs(this.config.verbCustomisations, this);
    }
  }

  get name() {
    return this.__name;
  }

  set name(name) {
    this.recordAlteredProperty("name", name);
    this.__name = name;

    const article = getArticle(name);

    if (article !== this.article) {
      this.article = article;
    }

    this.createAliases(name);
  }

  get article() {
    return this.__article;
  }

  set article(value) {
    this.recordAlteredProperty("article", value);
    this.__article = value;
  }

  get description() {
    return this.__description ? this.__description(this) : "";
  }

  set description(description: UnknownText) {
    this.recordAlteredProperty("description", description);
    this.__description = createDynamicText(description);
  }

  addVerbs(...verbs: VerbT[]) {
    verbs.forEach((verb) => this.addVerb(verb));
  }

  addVerb(verbOrBuilder: VerbT | VerbBuilderT) {
    const verb = verbOrBuilder instanceof Verb.Builder ? verbOrBuilder.build() : verbOrBuilder;

    if (!Array.isArray(this.__verbList)) {
      this.__verbList = [this.__verbList];
    }

    // Remove any existing instances of the verb.
    this.__verbList = this.__verbList.filter((existingVerb) => existingVerb.name !== verb.name);

    this.__verbList.push(verb);
    this.__verbs[verb.name.toLowerCase()] = verb;
    verb.parent = this;
  }

  getVerb(name: string) {
    const verb = this.verbs[name.toLowerCase()];

    if (!verb) {
      throw Error(`No verb with the name "${name}" exists on the item "${this.name}"`);
    }

    return verb;
  }

  private __addAliasesToContainer(aliases: string[]) {
    if (this.__container && aliases) {
      aliases.forEach((alias) => {
        const existing = this.__container!.items[alias.toLowerCase()];
        if (existing) {
          existing.push(this);
        } else {
          this.__container!.items[alias.toLowerCase()] = [this];
        }
      });
    }
  }

  get verbs() {
    return this.__verbs;
  }

  set verbs(verbs) {
    this.__verbs = verbs;
  }

  set verbList(verbs: Verb | VerbBuilderT | (Verb | VerbBuilderT)[]) {
    this.__verbList = [];
    this.__verbs = {};
    const verbArray = Array.isArray(verbs) ? verbs : [verbs];
    verbArray.forEach((verb) => this.addVerb(verb));
  }

  set container(container) {
    this.recordAlteredProperty("container", container);
    this.__container = container;
    this.__addAliasesToContainer(this.aliases);

    // If recordChanges is true, it indicates the game has started, so we'll reveal items when they move.
    if (selectRecordChanges() && container && !selectItemNames().has(this.name.toLowerCase())) {
      getStore().dispatch(itemsRevealed([this.name, ...this.aliases]));
    }
  }

  get container() {
    return this.__container;
  }

  get aliases(): string[] {
    return this.__aliases ? [...this.__aliases] : [];
  }

  set aliases(aliases: string | string[]) {
    const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
    this.recordAlteredProperty("aliases", aliasArray);
    this.__aliases = new Set(aliasArray);
    this.__addAliasesToContainer(this.aliases);
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
   * @param itemOrBuilder The item to add.
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
   * Remove an item from this item's collection. Does nothing if the item's not present.
   * @param item The item to remove
   * @param alias (Optional) The item alias to remove
   */
  removeItem(itemOrName: ItemT | string, alias?: string) {
    const item = resolveItem(itemOrName);

    if (!item) {
      return;
    }

    // Use the alias provided or just the item's actual name
    const name = alias ? alias : item.name.toLowerCase();

    if (this.items[name]) {
      // Remove the item from the array of items with its name
      this.items[name] = this.items[name].filter((itemWithName) => itemWithName !== item);

      // Remove the array if it's empty
      if (!this.items[name].length) {
        delete this.items[name];
      }
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
    this.__hidesItems = hidesItemsArray;
  }

  get hidesItems(): Item[] {
    return this.__hidesItems;
  }

  /**
   * Adds items this item hides to self.
   * @param itemsOrNames List of item objects or item names to reveal. Will only reveal items that this item hides.
   * If none are provided, all hidden items will be revealed.
   */
  revealItems(...itemsOrNames: (Item | string)[]) {
    if (!this.itemsVisibleFromSelf) {
      debug(`${this.name}: Not revealing items because they're not visible.`);
      return;
    }

    const itemsToReveal = this.hidesItems.filter(
      (item) =>
        !itemsOrNames.length ||
        itemsOrNames.some((itemOrName) => itemOrName === item || itemOrName === item.name)
    );

    if (!itemsToReveal.length) {
      debug(`${this.name}: Not revealing items because none match the list to be revealed.`);
      return;
    }

    debug(`${this.name}: Revealing items`);

    itemsToReveal.forEach((item) => {
      debug(`${this.name}: Adding item ${item.name} to self`);
      this.addItem(item);
    });

    getStore().dispatch(itemsRevealed(itemsToReveal.flatMap((item) => [item.name, ...item.aliases])));

    if (this.hidesItems.length) {
      // Remove items that we've revealed from the list of hidden items.
      this.hidesItems = this.hidesItems.filter((item) => !itemsToReveal.includes(item));
    }
  }

  get containerListing() {
    return this.__containerListing?.(this);
  }

  set containerListing(listing: UnknownText | undefined) {
    this.recordAlteredProperty("containerListing", listing);
    this.__containerListing = listing ? createDynamicText(listing) : undefined;
  }

  get items() {
    return this.__items;
  }

  set items(items) {
    this.__items = items;
    this.uniqueItems = new Set(
      Object.values(this.__items).reduce((acc, itemsWithName) => {
        itemsWithName.forEach((item) => acc.push(item));
        return acc;
      }, [])
    );
  }

  get capacity() {
    return this.__capacity;
  }

  set capacity(capacity) {
    this.recordAlteredProperty("capacity", capacity);
    this.__capacity = capacity;
    this.free = capacity;

    if (capacity > 0) {
      this.canHoldItems = true;
    }
  }

  get free() {
    return this.__free;
  }

  set free(value) {
    this.__free = value;
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
    this.__addAliasesToContainer(newAliases);
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
      // Token mustn't be zero length
      .filter((token) => token.length)
      // Token mustn't be one of our existing aliases
      .filter((token) => !this.aliases.some((word) => word === token))
      // Token mustn't be a common word
      .filter((token) => !commonWords.some((word) => word === token))
      // Token mustn't be an alias we want to omit
      .filter((token) => !this.config?.omitAliases?.some((omit) => omit === token));

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

  private __getActionChain(verbName: string, onFailure: boolean) {
    const verb = this.getVerb(verbName);
    return onFailure ? verb.onFailure : verb.onSuccess;
  }

  /*
   * Adds an action to the specified verb. By default, functions are added to the beginning of the chain of on-success actions and
   * anything else is added to the end.
   */
  addAction(verbName: string, action: ContextAction, onFailure: boolean, addToEnd: boolean) {
    const actionChain = this.__getActionChain(verbName, onFailure);

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
    const actionChain = this.__getActionChain(verbName, onFailure);
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
    return this.properNoun ? "" : "the ";
  }

  get holdable() {
    return this.__holdable;
  }

  set holdable(value) {
    this.recordAlteredProperty("holdable", value);
    this.__holdable = value;
  }

  get size() {
    return this.__size;
  }

  set size(value) {
    this.recordAlteredProperty("size", value);
    this.__size = value;
  }

  get visible() {
    return this.__visible;
  }

  set visible(value) {
    this.recordAlteredProperty("visible", value);
    this.__visible = value;
  }

  get canHoldItems() {
    return this.__canHoldItems;
  }

  set canHoldItems(value) {
    this.recordAlteredProperty("canHoldItems", value);
    this.__canHoldItems = value;
  }

  get preposition() {
    return this.__preposition;
  }

  set preposition(value) {
    this.recordAlteredProperty("preposition", value);
    this.__preposition = value;
  }

  get itemsVisibleFromSelf() {
    return this.__itemsVisibleFromSelf;
  }

  set itemsVisibleFromSelf(value) {
    this.recordAlteredProperty("itemsVisibleFromSelf", value);
    this.__itemsVisibleFromSelf = value;
  }

  get itemsVisibleFromRoom() {
    return this.__itemsVisibleFromRoom;
  }

  set itemsVisibleFromRoom(value) {
    this.recordAlteredProperty("itemsVisibleFromRoom", value);
    this.__itemsVisibleFromRoom = value;
  }

  get doNotList() {
    return this.__doNotList;
  }

  set doNotList(value) {
    this.recordAlteredProperty("doNotList", value);
    this.__doNotList = value;
  }

  get properNoun() {
    return this.__properNoun;
  }

  set properNoun(value) {
    this.recordAlteredProperty("properNoun", value);
    this.__properNoun = value;
  }

  get onTake() {
    return this.__onTake;
  }

  set onTake(value) {
    this.__onTake = value;
  }

  get verbCustomisations() {
    return this.__verbCustomisations;
  }

  set verbCustomisations(value) {
    this.__verbCustomisations = value;
  }

  get omitAliases() {
    return this.__omitAliases;
  }

  set omitAliases(value) {
    this.__omitAliases = value;
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
    return this.__properties;
  }

  set properties(value) {
    this.recordAlteredProperty("properties", value);
    this.__properties = value;
  }

  get config() {
    return this.__config;
  }

  set config(value) {
    this.__config = value;
  }

  toJSON() {
    return [...this.__alteredProperties]
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
    if (this.__cloned || !this.__constructed) {
      // We won't serialize cloned objects, or objects constructed after recording began, so won't record their changes.
      return;
    }

    // If the new value being set is a Text, add an onChange callback so we know about internal changes.
    if (newValue instanceof Text || newValue instanceof ManagedText) {
      this.__handleTextPropertyPersistence(propertyName, newValue);
    }

    const recordChanges = selectRecordChanges();
    if (recordChanges && typeof newValue === "function") {
      throw Error(
        `Updated item property "${propertyName}" to a function. This is non-serializable and hence can't be recorded into the save file.`
      );
    }

    if (recordChanges) {
      this.alteredProperties.add(propertyName);
    }
  }

  get alteredProperties() {
    return this.__alteredProperties;
  }

  private __handleTextPropertyPersistence(propertyName: string, value: TextT | ManagedTextT) {
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

  isProperNoun(properNoun = true) {
    this.config.properNoun = properNoun;
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

  onTake(...value: Action[]) {
    this.config.onTake = value;
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

  customiseVerb(verbName: string, customisation: (verb: VerbT) => void) {
    if (!this.config.verbCustomisations) {
      this.config.verbCustomisations = {};
    }

    this.config.verbCustomisations[verbName] = customisation;
    return this;
  }

  build() {
    return new Item(undefined, undefined, false, 0, undefined, undefined, undefined, this);
  }
}
