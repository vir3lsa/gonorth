import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import { AppendInput } from "./interaction";
import { selectGame } from "../utils/selectors";
import { chainActions, createChainableFunction } from "../utils/actionChain";

export default class Option {
  constructor(label, action) {
    this.label = label;
    this.action = action;
  }

  get action() {
    return this._action;
  }

  set action(action) {
    const actionChain = createChainableFunction(action);

    this._action = async (...args) => {
      // Record player decision
      getStore().dispatch(changeInteraction(new AppendInput(this.label)));
      // First perform the player actions
      await chainActions(actionChain, ...args);

      if (!getStore().getState().game.actionChainPromise) {
        // Do the end of turn actions if there's no enclosing chain i.e. we came from room options
        return selectGame().handleTurnEnd();
      }
    };
  }
}
