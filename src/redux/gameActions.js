import * as type from "./gameActionTypes";
import { output, showOptions, promptInput } from "../utils/consoleIO";
import { parsePlayerInput } from "../game/parser";

const selectInBrowser = state => state.game.inBrowser;
const selectDebugMode = state => state.game.debugMode;
const selectOutput = state => state.game.interaction.currentPage;
const selectOptions = state => state.game.interaction.options;
const selectPlayerInput = state => state.game.playerInput;

export const newGame = (game, inBrowser, debugMode) => ({
  type: type.NEW_GAME,
  payload: { game, inBrowser, debugMode }
});

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

export const receivePlayerInput = input => (dispatch, getState) => {
  dispatch({
    type: type.RECEIVE_INPUT,
    payload: input
  });

  const state = getState();
  const inBrowser = selectInBrowser(state);
  const debugMode = selectDebugMode(state);
  const currentInput = selectPlayerInput(state);

  if (currentInput && currentInput.length) {
    if (inBrowser && debugMode) {
      output(`Received input: ${currentInput}`);
    }

    parsePlayerInput(currentInput);
  }
};

export const nextTurn = () => ({
  type: type.NEXT_TURN
});
