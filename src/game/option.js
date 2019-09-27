import { store } from "../redux/store";
import Room from "./room";

export default class Option {
  constructor(label, action) {
    this.label = label;

    if (action instanceof Room) {
      // Allow Rooms to be passed as actions, as a shortcut for the below
      this.action = () => (store.getState().game.game.room = action);
    } else {
      this.action = action;
    }
  }
}
