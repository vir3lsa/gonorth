import { getStore } from "../../redux/storeRegistry";
import { Door } from "./door";
import { GoVerb, Verb } from "../verbs/verb";
import { Item, Builder as ItemBuilder, customiseVerbs, omitAliases } from "./item";
import { itemsRevealed, changeImage, addRoom } from "../../redux/gameActions";
import { preferPaged } from "../../utils/dynamicDescription";
import { ActionChain } from "../../utils/actionChain";
import { goToRoom } from "../../gonorth";
import { getBasicItemList, toTitleCase } from "../../utils/textFunctions";
import { debug } from "../../utils/consoleIO";
import { checkpoint } from "../../utils/lifecycle";

const directionAliases = {
  north: ["n", "forward", "straight on"],
  south: ["s", "back", "backward", "backwards", "reverse"],
  east: ["e", "right"],
  west: ["w", "left"],
  up: ["u", "upward", "upwards"],
  down: ["d", "downward", "downwards"],
} as {
  [name: string]: string[] | undefined;
};

const newRoom = (config: RoomConfig & ItemConfig) => {
  const { name, description, checkpoint, verbs, aliases, ...remainingConfig } = config;
  const room = new Room(name, description, checkpoint, aliases);

  if (verbs) {
    room.addVerbs(...verbs);
  }

  Object.entries(remainingConfig).forEach(([key, value]) => (room[key] = value));
  customiseVerbs(config.verbCustomisations, room);

  // Remove unwanted aliases.
  omitAliases(config.omitAliases, room);

  return room;
};

export class Room extends Item {
  private _adjacentRooms!: AdjacentRooms;
  private _image?: string;
  private _checkpoint!: boolean;

  constructor(name: string, description: UnknownText = "placeholder", checkpoint = true, aliases?: string[]) {
    super(name, preferPaged(description), false, -1, undefined, aliases);
    this.adjacentRooms = {};
    this.canHoldItems = true;
    this.aliases = [...this.aliases, "room", "floor"];
    this.checkpoint = checkpoint;
    this.isRoom = true;
    getStore().dispatch(addRoom(this));

    this.addVerbs(new GoVerb("north", directionAliases["north"] as string[], this));
    this.addVerbs(new GoVerb("south", directionAliases["south"] as string[], this));
    this.addVerbs(new GoVerb("east", directionAliases["east"] as string[], this));
    this.addVerbs(new GoVerb("west", directionAliases["west"] as string[], this));
    this.addVerbs(new GoVerb("up", directionAliases["up"] as string[], this));
    this.addVerbs(new GoVerb("down", directionAliases["down"] as string[], this));
  }

  set image(image) {
    this._image = image;
  }

  get image() {
    return this._image;
  }

  addAdjacentRoom(
    room?: RoomT,
    directionName?: DirectionName,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string
  ) {
    let test: Test | Door | undefined = navigable;
    let failText = failureText;

    if (typeof navigable === "undefined") {
      test = () => true;
    } else if (typeof navigable === "boolean") {
      test = () => navigable;
    } else if (navigable instanceof Door) {
      test = () => navigable.open;
      failText = failText || `The ${navigable.name} is closed.`;
    }

    const onSuccessArray = !onSuccess || Array.isArray(onSuccess) ? onSuccess : [onSuccess];
    const directionObject = {
      room,
      test,
      onSuccess: onSuccessArray,
      failureText: failText,
      directionName,
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
            .withOnSuccess((context) => goThrough.attemptWithContext({ ...context, item: door!, verb: goThrough }))
            .build()
        );
      } else {
        this.addVerb(new GoVerb(directionName, [], this));
      }
    }
  }

  setNorth(
    room?: RoomT,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "north", navigable, onSuccess, failureText);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, onSuccess, failureText, false);
    }
  }

  setNorthDoor(door: Door) {
    this.setDirection({ door, directionName: "north" });
  }

  setSouth(
    room?: RoomT,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "south", navigable, onSuccess, failureText);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, onSuccess, failureText, false);
    }
  }

  setSouthDoor(door: Door) {
    this.setDirection({ door, directionName: "south" });
  }

  setEast(
    room?: RoomT,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "east", navigable, onSuccess, failureText);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, onSuccess, failureText, false);
    }
  }

  setEastDoor(door: Door) {
    this.setDirection({ door, directionName: "east" });
  }

  setWest(
    room?: RoomT,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "west", navigable, onSuccess, failureText);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, onSuccess, failureText, false);
    }
  }

  setWestDoor(door: Door) {
    this.setDirection({ door, directionName: "west" });
  }

  setUp(
    room?: RoomT,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "up", navigable, onSuccess, failureText);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setDown(this, navigable, onSuccess, failureText, false);
    }
  }

  setUpDoor(door: Door) {
    this.setDirection({ door, directionName: "up" });
  }

  setDown(
    room?: RoomT,
    navigable?: Navigable,
    onSuccess?: ContextAction | ContextAction[],
    failureText?: string,
    addInverse = true
  ) {
    this.addAdjacentRoom(room, "down", navigable, onSuccess, failureText);

    if (addInverse && room && room instanceof Room) {
      // Adjacent rooms are bidirectional by default
      room.setUp(this, navigable, onSuccess, failureText, false);
    }
  }

  setDownDoor(door: Door) {
    this.setDirection({ door, directionName: "down" });
  }

  go(directionName: DirectionName) {
    const direction = directionName.toLowerCase();
    const adjacent = this.adjacentRooms[direction].room;

    if (adjacent instanceof Room) {
      return goToRoom(adjacent);
    } else if (typeof adjacent === "function") {
      return adjacent();
    }
  }

  /**
   * Get the ActionChain associated with going to this room.
   */
  get actionChain() {
    const chain = new ActionChain(
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

    if (this.itemListings) {
      chain.postScript = this.itemListings;
    }

    return chain;
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
    return this._adjacentRooms;
  }

  set adjacentRooms(value) {
    this.recordAlteredProperty("adjacentRooms", value);
    this._adjacentRooms = value;
  }

  get checkpoint() {
    return this._checkpoint;
  }

  set checkpoint(value: boolean) {
    this.recordAlteredProperty("checkpoint", value);
    this._checkpoint = value;
  }

  static get Builder() {
    return Builder;
  }
}

class Builder extends ItemBuilder {
  config!: RoomConfig & ItemConfig;

  constructor(name?: string) {
    super(name);
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
    return newRoom(this.config);
  }
}