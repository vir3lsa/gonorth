import { getStore } from "../redux/storeRegistry";
import { nextTurn, receivePlayerInput } from "../redux/gameActions";

export const receiveInput = input => {
  // Trigger actions based on user input
  getStore().dispatch(receivePlayerInput(input));
  // Increment the turn once the CPU actions have finished
  getStore().dispatch(nextTurn());
};
