import { Interaction } from "./interaction";
import { getStore } from "../redux/storeRegistry";
import Door from "./door";
import { GoVerb } from "./verb";
import Item from "./item";
import { itemsRevealed } from "../redux/gameActions";

const selectGame = () => getStore().getState().game.game;

export default class Room extends Item {
  constructor(name, description, options) {
    super(name, description, false, -1, [
      new GoVerb("North", ["n", "forward", "straight on"]),
      new GoVerb("South", ["s", "back", "backward", "reverse"]),
      new GoVerb("East", ["e", "right"]),
      new GoVerb("West", ["w", "left"]),
      new GoVerb("Up", ["u", "upward", "upwards"]),
      new GoVerb("Down", ["d", "downward", "downwards"])
    ]);
    this.visits = 0;
    this.adjacentRooms = {};
    this.items = {};
    this.options = options;
  }

  get interaction() {
    return new Interaction(this.description, this.options);
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
    this.adjacentRooms[direction] = {
      room,
      test,
      successText,
      failureText,
      direction
    };

    // Add the verb if we don't already have it
    if (!this.verbs[directionName]) {
      this.addVerb(new GoVerb(directionName));
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
    selectGame().room = adjacent;
    return adjacent.interaction;
  }

  revealItems() {
    const itemNames = Object.entries(this.items)
      .filter(([, item]) => item.visible)
      .map(([name]) => name);

    getStore().dispatch(itemsRevealed(itemNames));
  }
}
