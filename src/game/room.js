import Interaction from "./interaction";
import { store } from "../redux/store";
import { changeInteraction } from "../redux/gameActions";
import Door from "./door";

const selectGame = () => store.getState().game.game;

export default class Room {
  constructor(name, description) {
    this.name = name;
    this.description = description;
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

  addAdjacentRoom(room, directionName, navigable, failMessage) {
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
      failMessage,
      direction
    };
  }

  setNorth(room, navigable, failMessage, addInverse = true) {
    this.addAdjacentRoom(room, "north", navigable, failMessage);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, failMessage, false);
    }
  }

  setSouth(room, navigable, failMessage, addInverse = true) {
    this.addAdjacentRoom(room, "south", navigable, failMessage);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, failMessage, false);
    }
  }

  setEast(room, navigable, failMessage, addInverse = true) {
    this.addAdjacentRoom(room, "east", navigable, failMessage);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, failMessage, false);
    }
  }

  setWest(room, navigable, failMessage, addInverse = true) {
    this.addAdjacentRoom(room, "west", navigable, failMessage);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, failMessage, false);
    }
  }

  setUp(room, navigable, failMessage, addInverse = true) {
    this.addAdjacentRoom(room, "up", navigable, failMessage);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setDown(this, navigable, failMessage, false);
    }
  }

  setDown(room, navigable, failMessage, addInverse = true) {
    this.addAdjacentRoom(room, "down", navigable, failMessage);

    if (addInverse && room) {
      // Adjacent rooms are bidirectional by default
      room.setUp(this, navigable, failMessage, false);
    }
  }

  go(directionName) {
    const direction = directionName.toLowerCase();
    const adjacent = this.adjacentRooms[direction];

    if (adjacent) {
      if (adjacent.test()) {
        selectGame().goToRoom(adjacent.room, `Going ${adjacent.direction}.`);
      } else {
        store.dispatch(
          changeInteraction(new Interaction(adjacent.failMessage))
        );
      }
    } else {
      store.dispatch(
        changeInteraction(new Interaction("There's nowhere to go that way."))
      );
    }
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
