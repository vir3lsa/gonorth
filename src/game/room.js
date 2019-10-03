import Interaction from "./interaction";
import { getStore } from "../redux/storeRegistry";
import Door from "./door";
import { GoVerb } from "./verb";
import Item from "./item";

const selectGame = () => getStore().getState().game.game;

export default class Room extends Item {
  constructor(name, description) {
    super(name, description, false, -1, [
      new GoVerb("north", ["forward", "straight on"]),
      new GoVerb("south", ["back", "backward", "reverse"]),
      new GoVerb("east", "right"),
      new GoVerb("west", "left"),
      new GoVerb("up", ["upward", "upwards"]),
      new GoVerb("down", ["downward", "downwards"])
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
    const adjacent = this.adjacentRooms[direction];
    selectGame().room = adjacent.room;
  }
}
