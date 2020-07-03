import { getStore } from "../../redux/storeRegistry";
import { Door } from "./door";
import { GoVerb } from "../verbs/verb";
import { Item } from "./item";
import { itemsRevealed } from "../../redux/gameActions";
import { preferPaged } from "../../utils/dynamicDescription";
import { ActionChain } from "../../utils/actionChain";
import { goToRoom } from "../../gonorth";
import { getKeyword, addKeyword, directionAliases } from "../verbs/keywords";
import { getBasicItemList, toTitleCase } from "../../utils/textFunctions";
import { debug } from "../../utils/consoleIO";

export class Room extends Item {
  constructor(name, description, options) {
    super(name, preferPaged(description), false, -1);
    this.visits = 0;
    this.adjacentRooms = {};
    this.options = options;
    this.canHoldItems = true;
    this.aliases = ["room", "floor"];
  }

  set options(options) {
    if (options) {
      this._options = Array.isArray(options) ? options : [options];
    }
  }

  get options() {
    return this._options;
  }

  addAdjacentRoom(room, directionName, navigable, onSuccess, failureText) {
    let test = navigable;

    if (typeof navigable === "undefined") {
      test = () => true;
    } else if (typeof navigable === "boolean") {
      test = () => navigable;
    } else if (navigable instanceof Door) {
      test = () => navigable.open;
    }

    const onSuccessArray =
      !onSuccess || Array.isArray(onSuccess) ? onSuccess : [onSuccess];
    const direction = directionName.toLowerCase();
    const aliases = [direction, ...(directionAliases[direction] || [])];
    const directionObject = {
      room,
      test,
      onSuccess: onSuccessArray,
      failureText,
      direction
    };

    // Map each of the direction aliases to the direction object
    aliases.forEach(alias => {
      this.adjacentRooms[alias] = directionObject;
    });

    // Add the keyword if we don't already have it
    if (!getKeyword(directionName)) {
      addKeyword(new GoVerb(directionName, [], true));
    }
  }

  setNorth(room, navigable, onSuccess, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "north", navigable, onSuccess, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, onSuccess, failureText, false);
    }
  }

  setSouth(room, navigable, onSuccess, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "south", navigable, onSuccess, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, onSuccess, failureText, false);
    }
  }

  setEast(room, navigable, onSuccess, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "east", navigable, onSuccess, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, onSuccess, failureText, false);
    }
  }

  setWest(room, navigable, onSuccess, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "west", navigable, onSuccess, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, onSuccess, failureText, false);
    }
  }

  setUp(room, navigable, onSuccess, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "up", navigable, onSuccess, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setDown(this, navigable, onSuccess, failureText, false);
    }
  }

  setDown(room, navigable, onSuccess, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "down", navigable, onSuccess, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setUp(this, navigable, onSuccess, failureText, false);
    }
  }

  go(directionName) {
    const direction = directionName.toLowerCase();
    const adjacent = this.adjacentRooms[direction].room;
    return goToRoom(adjacent);
  }

  /**
   * Get the ActionChain (including any options) associated with going to this room.
   */
  get actionChain() {
    const chain = new ActionChain(this.description);
    chain.options = this.options;

    if (this.itemListings) {
      chain.postScript = this.itemListings;
    }

    return chain;
  }

  revealVisibleItems() {
    const itemNames = Object.entries(this.accessibleItems)
      .filter(([, itemsWithName]) => itemsWithName.find(item => item.visible))
      .map(([name]) => name);

    getStore().dispatch(itemsRevealed(itemNames));
  }

  get itemListings() {
    debug(`Listing items in ${this.name}.`);
    let description = "";
    const plainList = []; // Items with no room listing

    this.uniqueItems.forEach(item => {
      if (item.roomListing) {
        debug(`Using ${item.name}'s room listing.`);
        description += `${item.roomListing} `;
      } else if (item.holdable) {
        debug(`Will simply list ${item.name} as it is holdable.`);
        plainList.push(item); // We'll list this item separately
      } else {
        debug(
          `${
            item.name
          } is not holdable and doesn't have a room listing so won't be listed.`
        );
      }
    });

    [...this.uniqueItems]
      .filter(item => Object.keys(item.items).length)
      .filter(container => container.itemsCanBeSeen)
      .forEach(container => {
        debug(`Listing ${container.name}'s items as they are visible.`);
        const describedItems = [];
        Object.values(container.items).forEach(itemsWithName =>
          itemsWithName
            .filter(item => item.roomListing)
            .forEach(describedItems.push)
        );
        debug(`Found ${describedItems.length} item(s) with room listings.`);
        const roomListings = describedItems
          .map(item => item.roomListing)
          .join(" ");
        const titleCasePrep = toTitleCase(container.preposition);
        const list = container.basicItemList;

        description += description.length ? "\n\n" : "";
        description += roomListings;

        if (list.length) {
          debug("Found a basic list of items");
          description += description.length ? "\n\n" : "";
          description += `${titleCasePrep} the ${
            container.name
          } there's ${list}.`;
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
}
