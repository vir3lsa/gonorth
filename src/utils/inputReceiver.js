import { getStore } from "../redux/storeRegistry";
import { receivePlayerInput, changeInteraction } from "../redux/gameActions";
import { Append } from "../game/interaction";

export const receiveInput = input => {
  if (input && input.length) {
    // Print user input to screen
    getStore().dispatch(changeInteraction(new Append(`\`>\` ${input}`)));
  }

  // Trigger actions based on user input
  getStore().dispatch(receivePlayerInput(input));
  // Do the end of turn actions
  getStore()
    .getState()
    .game.game.handleTurnEnd();
};
