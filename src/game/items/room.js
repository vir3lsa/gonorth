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

  addAdjacentRoom(room, directionName, navigable, successText, failureText) {
    let test = navigable;

    if (typeof navigable === "undefined") {
      test = () => true;
    } else if (typeof navigable === "boolean") {
      test = () => navigable;
    } else if (navigable instanceof Door) {
      test = () => navigable.open;
    }

    const direction = directionName.toLowerCase();
    const aliases = [direction, ...(directionAliases[direction] || [])];
    const directionObject = {
      room,
      test,
      successText,
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

  setNorth(room, navigable, successText, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "north", navigable, successText, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, successText, failureText, false);
    }
  }

  setSouth(room, navigable, successText, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "south", navigable, successText, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, successText, failureText, false);
    }
  }

  setEast(room, navigable, successText, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "east", navigable, successText, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, successText, failureText, false);
    }
  }

  setWest(room, navigable, successText, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "west", navigable, successText, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, successText, failureText, false);
    }
  }

  setUp(room, navigable, successText, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "up", navigable, successText, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setDown(this, navigable, successText, failureText, false);
    }
  }

  setDown(room, navigable, successText, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "down", navigable, successText, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setUp(this, navigable, successText, failureText, false);
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
      .filter(([, item]) => item.visible)
      .map(([name]) => name);

    getStore().dispatch(itemsRevealed(itemNames));
  }

  get itemListings() {
    let description = "";
    const plainList = []; // Items with no room listing

    this.uniqueItems.forEach(item => {
      if (item.roomListing) {
        description += `${item.roomListing} `;
      } else if (item.holdable) {
        plainList.push(item); // We'll list this item separately
      }
    });

    [...this.uniqueItems]
      .filter(item => Object.keys(item.items).length)
      .filter(container => container.itemsCanBeSeen)
      .forEach(container => {
        const titleCasePrep = toTitleCase(container.preposition);
        const list = container.basicItemList;
        description += description.length ? "\n\n" : "";
        description += `${titleCasePrep} the ${container.name} there's ${list}.`;
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
