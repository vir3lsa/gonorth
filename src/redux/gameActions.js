import * as type from "./gameActionTypes";
import { output, showOptions } from "../utils/consoleIO";
import { Parser } from "../game/parser";
import { AppendInput, Append } from "../game/interactions/interaction";

const selectDebugMode = (state) => state.debugMode;
const selectPlayerInput = (state) => state.playerInput;

export const newGame = (game, debugMode) => ({
  type: type.NEW_GAME,
  payload: { game, debugMode }
});

export const changeInteraction = (interaction) => (dispatch, getState) => {
  const state = getState();
  const debugMode = selectDebugMode(state);

  if (debugMode && !(interaction instanceof AppendInput)) {
    const currentOutput = interaction.currentPage;
    let currentOptions = interaction.options;

    if (!currentOptions && interaction instanceof Append) {
      // Current options are copied onto new interaction
      currentOptions = state.interaction.options;
    }

    if (currentOutput) {
      output(currentOutput);
    }

    if (currentOptions && currentOptions.length) {
      showOptions(currentOptions);
    }
  }

  dispatch({
    type: type.CHANGE_INTERACTION,
    payload: interaction
  });

  return interaction.promise;
};

export const changeImage = (image) => ({
  type: type.CHANGE_IMAGE,
  payload: image
});

export const receivePlayerInput = (input) => (dispatch, getState) => {
  dispatch({
    type: type.RECEIVE_INPUT,
    payload: input
  });

  const state = getState();
  const debugMode = selectDebugMode(state);
  const currentInput = selectPlayerInput(state);

  if (currentInput && currentInput.length) {
    if (debugMode) {
      output(`Received input: ${currentInput}`);
    }

    // Respond to input and return Promise that resolves when actions are complete
    return new Parser(currentInput).parse();
  }
};

export const nextTurn = () => ({
  type: type.NEXT_TURN
});

export const verbCreated = (names) => ({
  type: type.VERB_CREATED,
  payload: names
});

export const itemsRevealed = (itemNames) => ({
  type: type.ITEMS_REVEALED,
  payload: itemNames
});

export const chainStarted = (promise) => ({
  type: type.CHAIN_STARTED,
  payload: promise
});

export const chainEnded = (promise) => ({
  type: type.CHAIN_ENDED,
  payload: promise
});

export const addEvent = (event) => ({
  type: type.ADD_EVENT,
  payload: event
});

export const addKeywords = (keywords) => ({
  type: type.ADD_KEYWORDS,
  keywords
});

export const removeKeywords = (keyword) => ({
  type: type.REMOVE_KEYWORDS,
  keyword
});

export const addRoom = (room) => ({
  type: type.ADD_ROOM,
  room
});

export const addItem = (item) => ({
  type: type.ADD_ITEM,
  item
});

export const addOptionGraph = (optionGraph) => ({
  type: type.ADD_OPTION_GRAPH,
  optionGraph
});

export const loadSnapshot = (snapshot) => ({
  type: type.LOAD_SNAPSHOT,
  snapshot
});

export const resetState = () => ({
  type: type.RESET_STATE
});
