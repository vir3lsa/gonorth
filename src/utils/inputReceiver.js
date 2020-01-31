import { getStore } from "../redux/storeRegistry";
import { receivePlayerInput, changeInteraction } from "../redux/gameActions";
import { AppendInput } from "../game/interactions/interaction";
import { handleTurnEnd } from "./lifecycle";

export const receiveInput = async input => {
  // Print user input to screen
  getStore().dispatch(changeInteraction(new AppendInput(input)));
  // Trigger actions based on user input
  await getStore().dispatch(receivePlayerInput(input));
  // Do the end of turn actions
  return handleTurnEnd();
};
