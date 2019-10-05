import { output, promptInput, showOptions } from "../utils/consoleIO";
import { parsePlayerInput } from "./parser";
import { getStore } from "../redux/storeRegistry";

const selectInBrowser = state => state.game.inBrowser;
const selectDebugMode = state => state.game.debugMode;
const selectPlayerInput = state => state.game.playerInput;

let currentInput;

export default class Subscriber {
  constructor() {
    currentInput = selectPlayerInput(getStore().getState());
  }

  subscribe() {
    const state = getStore().getState();
    const inBrowser = selectInBrowser(state);
    const debugMode = selectDebugMode(state);

    const previousInput = currentInput;
    currentInput = selectPlayerInput(state);
    const inputChanged = currentInput && currentInput !== previousInput;

    if (!inBrowser || debugMode) {
      if (inBrowser && debugMode && inputChanged) {
        output(`Received input: ${currentInput}`);
      }
    }

    if (inputChanged) {
      parsePlayerInput(currentInput);
    }
  }
}
