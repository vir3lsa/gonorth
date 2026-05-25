import { getStore } from "../../redux/storeRegistry";
import { Door } from "./door";
import { GoVerb, Verb } from "../verbs/verb";
import { Item, Builder as ItemBuilder, customiseVerbs } from "./item";
import { itemsRevealed, changeImage, addRoom } from "../../redux/gameActions";
import { preferPaged } from "../../utils/dynamicDescription";
import { ActionChain } from "../../utils/actionChain";
import gn from "../../gonorth";
import { getBasicItemList, toTitleCase } from "../../utils/textFunctions";
import { debug } from "../../utils/consoleIO";
import { checkpoint } from "../../utils/lifecycle";
import {
  Action,
  AdjacentRooms,
  ContextAction,
  DirectionName,
  DirectionObject,
  ItemConfig,
  ItemT,
  Navigable,
  RoomConfig,
  RoomT,
  SimpleAction,
  Test,
  UnknownAction,
  UnknownText
} from "../../types/types";

const directionAliases = {
  north: ["n", "forward", "straight on"],
  south: ["s", "back", "backward", "backwards", "reverse"],
  east: ["e", "right"],
  west: ["w", "left"],
  up: ["u", "upward", "upwards"],
  down: ["d", "downward", "downwards"]
} as {
  [name: string]: string[];
};

/**
 * A Room is a location the player can be in. Rooms may be linked together directly, or via {@link game/items/door!Door | Doors},
 * and traversed between using directional keywords e.g. `north`, `west`, `s`, `up`, etc.
 * 
 * Rooms may contain {@link game/items/item!Item | Items}. If they're `holdable`, they'll automatically be included
 * in the description. Rooms (indeed, all containers) can also "hide" items, such that the Room must be examined before the items
 * can be discovered and interacted with by the player.
 * 
 * Rooms are constructed using a builder.
 * 
 * ```ts
 * const kitchen = new Room.Builder("kitchen")
 *   .withDescription("The kitchen is well-stocked and homely.")
 *   .hasItems(table, oven, sink)
 *   .hidesItems(cat, book, knife)
 *   .build();
 * ```
 */
export class Room extends Item {
  private __adjacentRooms!: AdjacentRooms;
  private __image?: string;
  private __checkpoint!: boolean;
  private __actionChain!: ActionChain;

  constructor(
    name: string,
    description: UnknownText = "placeholder",
    checkpoint = true,
    aliases?: string[],
    builder?: RoomBuilder
  ) {
    super(name, preferPaged(description), false, -1, undefined, aliases, undefined, builder);
    this.adjacentRooms = {};
    this.canHoldItems = true;
    this.aliases = [...this.aliases, "room", "floor"];
    this.checkpoint = checkpoint;
    this.isRoom = true;
    getStore().dispatch(addRoom(this));

    this.addVerbs(new GoVerb.Builder("north").withAliases(...directionAliases["north"]).withCurrentRoom(this));
    this.addVerbs(new GoVerb.Builder("south").withAliases(...directionAliases["south"]).withCurrentRoom(this));
    this.addVerbs(new GoVerb.Builder("east").withAliases(...directionAliases["east"]).withCurrentRoom(this));
    this.addVerbs(new GoVerb.Builder("west").withAliases(...directionAliases["west"]).withCurrentRoom(this));
    this.addVerbs(new GoVerb.Builder("up").withAliases(...directionAliases["up"]).withCurrentRoom(this));
    this.addVerbs(new GoVerb.Builder("down").withAliases(...directionAliases["down"]).withCurrentRoom(this));

    this.customiseVerbs(Room.name);
    this.prepareActionChain();
  }

  prepareActionChain() {
    this.__actionChain = new ActionChain(
      () => {
        if (this.checkpoint) {
          return checkpoint();
        }
      },
      () => {
        getStore().dispatch(changeImage(this.image));
      },
      this.description
    );
  }

  set image(image) {
    this.__image = image;
  }

  get image() {
    return this.__image;
  }

  addAdjacentRoom(
    room?: RoomT | UnknownAction,
    directionName?: DirectionName,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action
  ) {
    let test: Test | Door | undefined = navigable;
    let onFail = onFailure;

    if (typeof navigable === "undefined") {
      test = () => true;
    } else if (typeof navigable === "boolean") {
      test = () => navigable;
    } else if (navigable instanceof Door) {
      test = () => navigable.open;
      onFail = onFailure || `The ${navigable.name} is closed.`;
    }

    const onSuccessArray = !onSuccess || Array.isArray(onSuccess) ? onSuccess : [onSuccess];
    const directionObject = {
      room,
      test,
      onSuccess: onSuccessArray,
      onFailure: onFail,
      directionName
    } as DirectionObject;

    this.setDirection(directionObject);
  }

  addDoor(door: Door, directionName: DirectionName) {
    this.setDirection({ door, directionName });
  }

  setDirection(directionObject: DirectionObject) {
    const { directionName } = directionObject;
    const aliases: string[] = [directionName, ...(directionAliases[directionName || ""] || [])].filter(
      (alias) => alias
    ) as string[];

    // Map each of the direction aliases to the direction object
    aliases.forEach((alias) => {
      this.adjacentRooms[alias as string] = directionObject;
    });

    const door = directionObject.door;
    const goThrough = door?.getVerb("go through");

    // Add the keyword
    if (directionName) {
      if (goThrough) {
        this.addVerb(
          new Verb.Builder(directionName)
            .withAliases(...aliases)
            .onSuccess((context) => goThrough.attemptWithContext({ ...context, item: door!, verb: goThrough }))
            .build()
        );
      } else {
        this.addVerb(new GoVerb.Builder(directionName).withCurrentRoom(this));
      }
    }
  }

  setNorth(
    room?: RoomT | UnknownAction,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "north", navigable, onSuccess, onFailure);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, onSuccess, onFailure, false);
    }
  }

  setNorthDoor(door: Door) {
    this.setDirection({ door, directionName: "north" });
  }

  setSouth(
    room?: RoomT | UnknownAction,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "south", navigable, onSuccess, onFailure);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, onSuccess, onFailure, false);
    }
  }

  setSouthDoor(door: Door) {
    this.setDirection({ door, directionName: "south" });
  }

  setEast(
    room?: RoomT | UnknownAction,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "east", navigable, onSuccess, onFailure);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, onSuccess, onFailure, false);
    }
  }

  setEastDoor(door: Door) {
    this.setDirection({ door, directionName: "east" });
  }

  setWest(
    room?: RoomT | UnknownAction,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "west", navigable, onSuccess, onFailure);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, onSuccess, onFailure, false);
    }
  }

  setWestDoor(door: Door) {
    this.setDirection({ door, directionName: "west" });
  }

  setUp(
    room?: RoomT | UnknownAction,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "up", navigable, onSuccess, onFailure);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setDown(this, navigable, onSuccess, onFailure, false);
    }
  }

  setUpDoor(door: Door) {
    this.setDirection({ door, directionName: "up" });
  }

  setDown(
    room?: RoomT | UnknownAction,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    onFailure?: Action,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "down", navigable, onSuccess, onFailure);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setUp(this, navigable, onSuccess, onFailure, false);
    }
  }

  setDownDoor(door: Door) {
    this.setDirection({ door, directionName: "down" });
  }

  go(directionName: DirectionName) {
    const direction = directionName.toLowerCase();
    const adjacent = this.adjacentRooms[direction].room;

    if (adjacent instanceof Room) {
      return gn.goToRoom(adjacent);
    } else if (typeof adjacent === "function") {
      return adjacent();
    }
  }

  /**
   * Get the ActionChain associated with going to this room.
   */
  get actionChain() {
    const itemListings = this.itemListings;

    if (itemListings) {
      this.__actionChain.postScript = itemListings;
    }

    return this.__actionChain;
  }

  /**
   * Add visible items in the room to the list of globally registered item names
   * that it's possible to refer to. You can't refer to an item until you've
   * encountered it.
   */
  revealVisibleItems() {
    const itemNames = Object.entries(this.accessibleItems)
      .filter(([, itemsWithName]) => itemsWithName.find((item) => item.visible))
      .map(([name]) => name);

    getStore().dispatch(itemsRevealed(itemNames));
  }

  get itemListings() {
    debug(`Listing items in ${this.name}.`);
    let description = "";
    const plainList: ItemT[] = []; // Items with no room listing

    this.uniqueItems.forEach((item) => {
      if (item.containerListing) {
        debug(`Using ${item.name}'s room listing.`);
        description += `${item.containerListing} `;
      } else if (item.holdable && !item.doNotList) {
        debug(`Will simply list ${item.name} as it is holdable.`);
        plainList.push(item); // We'll list this item separately
      } else {
        debug(`${item.name} is not holdable and doesn't have a room listing (or is doNotList) so won't be listed.`);
      }
    });

    [...this.uniqueItems]
      .filter((item) => Object.keys(item.items).length)
      .filter((container) => container.itemsVisibleFromRoom)
      .forEach((container) => {
        debug(`Listing ${container.name}'s items as they are visible.`);
        const describedItems: ItemT[] = [];
        Object.values(container.items).forEach((itemsWithName) =>
          itemsWithName.filter((item) => item.containerListing).forEach((item) => describedItems.push(item))
        );
        debug(`Found ${describedItems.length} item(s) with room listings.`);
        const containerListings = describedItems.map((item) => item.containerListing).join(" ");
        const titleCasePrep = toTitleCase(container.preposition);
        const list = container.basicItemList;

        description += description.length ? "\n\n" : "";
        description += containerListings;

        if (list.length) {
          debug("Found a basic list of items");
          description += description.length ? "\n\n" : "";
          description += `${titleCasePrep} the ${container.name} there's ${list}.`;
        }
      });

    if (plainList.length) {
      // Just list any items without room listings
      description += description.length ? "\n\n" : "";
      description += `You also see ${getBasicItemList(plainList)}.`;
    }

    return description;
  }

  /*
   * Overrides the default implementation on Item to include room listings.
   */
  getFullDescription() {
    return this.actionChain;
  }

  get adjacentRooms() {
    return this.__adjacentRooms;
  }

  set adjacentRooms(value) {
    this.recordAlteredProperty("adjacentRooms", value);
    this.__adjacentRooms = value;
  }

  get checkpoint() {
    return this.__checkpoint;
  }

  set checkpoint(value: boolean) {
    this.recordAlteredProperty("checkpoint", value);
    this.__checkpoint = value;
  }

  static get Builder() {
    return RoomBuilder;
  }
}

export class RoomBuilder extends ItemBuilder {
  config!: RoomConfig & ItemConfig;

  constructor(name?: string) {
    super(name);
    this.config.description = "placeholder";
    this.config.checkpoint = true;
    this.config.size = -1;
  }

  withDescription(description: UnknownText) {
    this.config.description = preferPaged(description);
    return this;
  }

  isCheckpoint(checkpoint: boolean = true) {
    this.config.checkpoint = checkpoint;
    return this;
  }

  withImage(image: string) {
    this.config.image = image;
    return this;
  }

  build() {
    const { name, description, checkpoint, aliases } = this.config;
    return new Room(name, description, checkpoint, aliases, this);
  }
}