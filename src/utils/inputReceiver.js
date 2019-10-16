import { getStore } from "../redux/storeRegistry";
import { receivePlayerInput, changeInteraction } from "../redux/gameActions";
import { AppendInput } from "../game/interaction";
import { selectGame } from "./selectors";

export const receiveInput = async input => {
  if (input && input.length) {
    // Print user input to screen
    getStore().dispatch(changeInteraction(new AppendInput(input)));
  }

  // Trigger actions based on user input
  await getStore().dispatch(receivePlayerInput(input));
  // Do the end of turn actions
  return selectGame().handleTurnEnd();
};
