import * as type from "./gameActionTypes";
import { output, showOptions, promptInput } from "../utils/consoleIO";

export const newGame = (game, inBrowser, debugMode) => ({
  type: type.NEW_GAME,
  payload: { game, inBrowser, debugMode }
});

const selectInBrowser = state => state.game.inBrowser;
const selectDebugMode = state => state.game.debugMode;
const selectOutput = state => state.game.interaction.currentPage;
const selectOptions = state => state.game.interaction.options;

export const changeInteraction = interaction => (dispatch, getState) => {
  dispatch({
    type: type.CHANGE_INTERACTION,
    payload: interaction
  });

  const state = getState();
  const inBrowser = selectInBrowser(state);
  const debugMode = selectDebugMode(state);

  if (!inBrowser || debugMode) {
    const currentOutput = selectOutput(state);
    const currentOptions = selectOptions(state);

    output(
      `${!inBrowser ? "\n" : ""}${currentOutput}${!inBrowser ? "\n" : ""}`
    );

    if (inBrowser && currentOptions && currentOptions.length) {
      showOptions(currentOptions);
    } else if (!inBrowser) {
      promptInput(currentOptions);
    }
  }
};

export const receivePlayerInput = input => ({
  type: type.RECEIVE_INPUT,
  payload: input
});

export const nextTurn = () => ({
  type: type.NEXT_TURN
});
