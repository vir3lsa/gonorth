import { getStore } from "../../redux/storeRegistry";
import { changeInteraction, cyChoose } from "../../redux/gameActions";
import { AppendInput } from "./interaction";
import { ActionChain } from "../../utils/actionChain";
import { handleTurnEnd } from "../../utils/lifecycle";
import { selectActionChainPromise } from "../../utils/selectors";
import { AnyAction } from "redux";

export class Option {
  private _action!: OptionAction;
  label: string;
  endTurn: boolean;

  constructor(label: string, action?: Action, endTurn = true) {
    this.label = label;
    this.endTurn = endTurn;

    if (action) {
      this.setAction(action);
    }
  }

  get action() {
    return this._action;
  }

  setAction(action: Action) {
    const actionArray = Array.isArray(action) ? action : [action];
    const actionChain = new ActionChain(...actionArray);

    this._action = async () => {
      // Record player decision
      getStore().dispatch(changeInteraction(new AppendInput(this.label)) as AnyAction);
      getStore().dispatch(cyChoose(this.label) as AnyAction);

      // First perform the player actions
      await actionChain.chain({ option: this.label });

      if (!selectActionChainPromise() && this.endTurn) {
        // Do the end of turn actions if there's no enclosing chain i.e. we came from room options
        return handleTurnEnd();
      }
    };
  }
}
