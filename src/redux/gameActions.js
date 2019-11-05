import * as type from "./gameActionTypes";
import {
  output,
  showOptions,
  promptInput,
  isPromptActive,
  cancelActivePrompt
} from "../utils/consoleIO";
import { parsePlayerInput } from "../game/parser";
import { AppendInput, Append } from "../game/interaction";

const selectInBrowser = state => state.game.inBrowser;
const selectDebugMode = state => state.game.debugMode;
const selectPlayerInput = state => state.game.playerInput;

export const newGame = (game, inBrowser, debugMode) => ({
  type: type.NEW_GAME,
  payload: { game, inBrowser, debugMode }
});

export const changeInteraction = interaction => (dispatch, getState) => {
  const state = getState();
  const inBrowser = selectInBrowser(state);
  const debugMode = selectDebugMode(state);

  if ((!inBrowser || debugMode) && !(interaction instanceof AppendInput)) {
    const currentOutput = interaction.currentPage;
    let currentOptions = interaction.options;

    if (!currentOptions && interaction instanceof Append) {
      // Current options are copied onto new interaction
      currentOptions = state.game.interaction.options;
    }

    if (isPromptActive()) {
      // Don't want more than one prompt active at once
      cancelActivePrompt();
    }

    output(
      `${!inBrowser ? "\n" : ""}${currentOutput}${!inBrowser ? "\n" : ""}`
    );

    if (inBrowser && currentOptions && currentOptions.length) {
      showOptions(currentOptions);
    } else if (!inBrowser) {
      promptInput(currentOptions);
    }
  }

  dispatch({
    type: type.CHANGE_INTERACTION,
    payload: interaction
  });

  return interaction.promise;
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

    // Respond to input and return Promise that resolves when actions are complete
    return parsePlayerInput(currentInput);
  }
};

export const nextTurn = () => ({
  type: type.NEXT_TURN
});

export const verbCreated = names => ({
  type: type.VERB_CREATED,
  payload: names
});

export const itemsRevealed = itemNames => ({
  type: type.ITEMS_REVEALED,
  payload: itemNames
});

export const chainStarted = promise => ({
  type: type.CHAIN_STARTED,
  payload: promise
});

export const chainEnded = promise => ({
  type: type.CHAIN_ENDED,
  payload: promise
});

export const addEvent = event => ({
  type: type.ADD_EVENT,
  payload: event
});
