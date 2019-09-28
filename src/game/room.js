import Interaction from "./interaction";
import { store } from "../redux/store";
import { changeInteraction } from "../redux/gameActions";

const selectGame = () => store.getState().game.game;

export default class Room {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.firstVisitText = "";
    this.subsequentVisitsText = "";
    this.visits = 0;
    this.adjacentRooms = {};
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

  addAdjacentRoom(room, directionName, navigable, lockedMessage) {
    let test = navigable;
    let message = lockedMessage;

    if (typeof navigable === "undefined") {
      test = () => true;
    } else if (typeof navigable === "boolean") {
      test = () => navigable;
    }

    // TODO If navigable's a door, test whether the door's open and set the message from the door

    const direction = directionName.toLowerCase();
    this.adjacentRooms[direction] = {
      room,
      test,
      message,
      direction
    };
  }

  setNorth(room, navigable, lockedMessage, addInverse = true) {
    this.addAdjacentRoom(room, "north", navigable, lockedMessage);

    if (addInverse) {
      // Adjacent rooms are bidirectional by default
      room.setSouth(this, navigable, lockedMessage, false);
    }
  }

  setSouth(room, navigable, lockedMessage, addInverse = true) {
    this.addAdjacentRoom(room, "south", navigable, lockedMessage);

    if (addInverse) {
      // Adjacent rooms are bidirectional by default
      room.setNorth(this, navigable, lockedMessage, false);
    }
  }

  setEast(room, navigable, lockedMessage, addInverse = true) {
    this.addAdjacentRoom(room, "east", navigable, lockedMessage);

    if (addInverse) {
      // Adjacent rooms are bidirectional by default
      room.setWest(this, navigable, lockedMessage, false);
    }
  }

  setWest(room, navigable, lockedMessage, addInverse = true) {
    this.addAdjacentRoom(room, "west", navigable, lockedMessage);

    if (addInverse) {
      // Adjacent rooms are bidirectional by default
      room.setEast(this, navigable, lockedMessage, false);
    }
  }

  go(directionName) {
    const direction = directionName.toLowerCase();
    const adjacent = this.adjacentRooms[direction];

    if (adjacent) {
      if (adjacent.test()) {
        selectGame().goToRoom(adjacent.room, `Going ${adjacent.direction}.`);
      }
    } else {
      store.dispatch(
        changeInteraction(new Interaction("There's nowhere to go that way."))
      );
    }
  }
}
