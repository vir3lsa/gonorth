import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import Interaction from "./interaction";
import Option from "./option";

export default class Verb {
  constructor(name, action, successText, failureText, test = true) {
    this.name = name.trim().toLowerCase();
    this.action = action;

    // Call test setter
    this.test = test;

    // Call the successText setter
    this.successText = successText;

    // Call the failureText setter
    this.failureText = failureText;
  }

  /**
   * @param {boolean | (() => boolean) | undefined} test
   */
  set test(test) {
    if (typeof test === "undefined") {
      this._test = () => true;
    } else if (typeof test === "boolean") {
      this._test = () => test;
    } else {
      this._test = test;
    }
  }

  /**
   * @param {string | Interaction | (() => Interaction)} successText
   */
  set successText(successText) {
    if (typeof successText === "string") {
      this._successText = () => new Interaction(successText);
    } else if (successText instanceof Interaction) {
      this._successText = () => successText;
    } else {
      this._successText = successText;
    }
  }

  /**
   * @param {string | Interaction | (() => Interaction)} failureText
   */
  set failureText(failureText) {
    if (typeof failureText === "string") {
      this._failureText = () => new Interaction(failureText);
    } else if (failureText instanceof Interaction) {
      this._failureText = () => failureText;
    } else {
      this._failureText = failureText;
    }
  }

  attempt(...args) {
    if (this._test(...args)) {
      this.action(...args);
      if (this._successText) {
        getStore().dispatch(changeInteraction(this._successText(...args)));
      }
    } else if (this._failureText) {
      getStore().dispatch(changeInteraction(this._failureText(...args)));
    }
  }
}

export class GoVerb extends Verb {
  constructor(name) {
    super(
      name,
      room => room.go(name),
      room => {
        const adjacentRoom = room.adjacentRooms[name];
        return new Interaction(
          `Going ${name}.`,
          new Option("Next", () =>
            getStore().dispatch(
              changeInteraction(adjacentRoom.room.interaction)
            )
          )
        );
      },
      room => {
        const adjacentRoom = room.adjacentRooms[name];
        return adjacentRoom && adjacentRoom.failureText
          ? new Interaction(adjacentRoom.failureText)
          : new Interaction("There's nowhere to go that way.");
      },
      room => {
        const adjacentRoom = room.adjacentRooms[name];
        return adjacentRoom && adjacentRoom.test();
      }
    );
  }
}
