import { getStore } from "../../lib/redux/storeRegistry";
import { changeInteraction } from "../../lib/redux/gameActions";
import { Interaction } from "./interaction";
import Option from "./option";

export default class Verb {
  constructor(name, action, successText, failureText, test = true) {
    this.name = name.trim().toLowerCase();
    this._action = action;
    this._successText = successText;
    this._failureText = failureText;
    this._test = test;

    if (typeof successText === "string") {
      this._successText = () => new Interaction(successText);
    } else if (successText instanceof Interaction) {
      this._successText = () => successText;
    }

    if (typeof failureText === "string") {
      this._failureText = () => new Interaction(failureText);
    } else if (failureText instanceof Interaction) {
      this._failureText = () => failureText;
    }

    if (typeof test === "undefined") {
      this._test = () => true;
    } else if (typeof test === "boolean") {
      this._test = () => test;
    }
  }

  attempt(...args) {
    if (this._test(...args)) {
      this._action(...args);
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
      room =>
        new Interaction(
          `Going ${name}.`,
          new Option("Next", () =>
            getStore().dispatch(changeInteraction(room.interaction))
          )
        ),
      room => {
        const adjacentRoom = room.adjacentRooms[name];
        return adjacentRoom
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
