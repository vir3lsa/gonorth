import { getStore } from "../../redux/storeRegistry";
import { receivePlayerInput, changeInteraction } from "../../redux/gameActions";
import { AppendInput } from "../interactions/interaction";
import { handleTurnEnd } from "../../utils/lifecycle";
import { AnyAction } from "redux";

export const receiveInput = async (input: string) => {
  // Print user input to screen
  getStore().dispatch(changeInteraction(new AppendInput(input)) as AnyAction);
  // Trigger actions based on user input
  await getStore().dispatch(receivePlayerInput(input) as AnyAction);
  // Do the end of turn actions
  return handleTurnEnd();
};
