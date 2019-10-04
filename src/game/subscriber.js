import { output, promptInput, showOptions } from "../utils/consoleIO";
import { parsePlayerInput } from "./parser";
import { getStore } from "../redux/storeRegistry";

const selectOutput = state => state.game.interaction.currentPage;
const selectOptions = state => state.game.interaction.options;
const selectInBrowser = state => state.game.inBrowser;
const selectDebugMode = state => state.game.debugMode;
const selectPlayerInput = state => state.game.playerInput;

let currentOutput;
let currentOptions;
let currentInput;

export default class Subscriber {
  constructor() {
    currentOutput = selectOutput(getStore().getState());
    currentOptions = selectOptions(getStore().getState());
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
      let previousOutput = currentOutput;
      let previousOptions = currentOptions;

      currentOutput = selectOutput(state);
      currentOptions = selectOptions(state);

      if (currentOutput !== previousOutput) {
        output(currentOutput);
      }

      if (inputChanged) {
        output(`Received input: ${currentInput}`);
      }

      if (currentOptions && currentOptions !== previousOptions) {
        if (inBrowser) {
          showOptions(currentOptions);
        } else {
          promptInput(currentOptions);
        }
      }
    }

    if (inputChanged) {
      parsePlayerInput(currentInput);
    }
  }
}
