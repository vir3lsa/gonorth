import Interaction from "./interaction";
import { getStore } from "../redux/storeRegistry";
import Door from "./door";
import { GoVerb } from "./verb";
import Item from "./item";

const selectGame = () => getStore().getState().game.game;

export default class Room extends Item {
  constructor(name, description) {
    super(name, description, false, -1, [
      new GoVerb("north"),
      new GoVerb("south"),
      new GoVerb("east"),
      new GoVerb("west"),
      new GoVerb("up"),
      new GoVerb("down")
    ]);
    this.firstVisitText = "";
    this.subsequentVisitsText = "";
    this.visits = 0;
    this.adjacentRooms = {};
    this.items = {};
  }

  get interaction() {
    if (this.visits) {
      return new Interaction(
        this.subsequentVisitsText
          ? this.subsequentVisitsText
          : this.description,
        this.options
      );
    } else {
      return new Interaction(
        this.firstVisitText ? this.firstVisitText : this.description,
        this.options
      );
    }
  }

  addAdjacentRoom(room, directionName, navigable, failureText) {
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
      failureText,
      direction
    };

    // Add the verb if we don't already have it
    if (!this.verbs[directionName]) {
      this.addVerb(new GoVerb(directionName));
    }
  }

  setNorth(room, navigable, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "north", navigable, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, failureText, false);
    }
  }

  setSouth(room, navigable, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "south", navigable, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, failureText, false);
    }
  }

  setEast(room, navigable, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "east", navigable, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, failureText, false);
    }
  }

  setWest(room, navigable, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "west", navigable, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, failureText, false);
    }
  }

  setUp(room, navigable, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "up", navigable, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setDown(this, navigable, failureText, false);
    }
  }

  setDown(room, navigable, failureText, addInverse = true) {
    this.addAdjacentRoom(room, "down", navigable, failureText);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setUp(this, navigable, failureText, false);
    }
  }

  go(directionName) {
    const direction = directionName.toLowerCase();
    const adjacent = this.adjacentRooms[direction];
    selectGame().room = adjacent.room;
  }

  /**
   * Adds an item to this room's roster.
   * @param {Item} item The item to add.
   */
  addItem(item) {
    const name = item.name;

    if (!name) {
      throw Error("Item does not have a name");
    }

    if (this.items[name]) {
      throw Error(`Room '${this.name}' already has an item called '${name}'`);
    }

    this.items[name] = item;
  }
}
