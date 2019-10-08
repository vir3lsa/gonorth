import { getStore } from "../redux/storeRegistry";
import { nextTurn, receivePlayerInput } from "../redux/gameActions";

export const receiveInput = input => {
  // Trigger actions based on user input
  getStore().dispatch(receivePlayerInput(input));
  // Do the end of turn actions
  getStore()
    .getState()
    .game.game.handleTurnEnd();
};
