import { getStore } from "../redux/storeRegistry";
import { nextTurn } from "../redux/gameActions";

export default class Option {
  constructor(label, action) {
    this.label = label;
    this.action = action;
  }

  get action() {
    return this._action;
  }

  set action(action) {
    this._action = (...args) => {
      // First perform the player action
      action(...args);
      // Increment the turn once the CPU actions have finished
      getStore().dispatch(nextTurn());
    };
  }
}
