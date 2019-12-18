import { getStore } from "../../redux/storeRegistry";
import { changeInteraction } from "../../redux/gameActions";
import { AppendInput } from "./interaction";
import { selectGame } from "../../utils/selectors";
import { ActionChain } from "../../utils/actionChain";
import { handleTurnEnd } from "../../utils/lifecycle";

export default class Option {
  constructor(label, action) {
    this.label = label;
    this.action = action;
  }

  get action() {
    return this._action;
  }

  set action(action) {
    const actionChain = new ActionChain(action);

    this._action = async (...args) => {
      // Record player decision
      getStore().dispatch(changeInteraction(new AppendInput(this.label)));
      // First perform the player actions
      await actionChain.chain(...args);

      if (!getStore().getState().game.actionChainPromise) {
        // Do the end of turn actions if there's no enclosing chain i.e. we came from room options
        return handleTurnEnd();
      }
    };
  }
}
