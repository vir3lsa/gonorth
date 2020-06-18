import { receiveInput } from "./inputReceiver";
import { selectDebugMode } from "./selectors";

let promptPromise;

export const output = text => {
  console.log(text);
};

export const debug = text => {
  if (selectDebugMode()) {
    output(text);
  }
};

export const isPromptActive = () => {
  return Boolean(promptPromise);
};

export const cancelActivePrompt = () => {
  prompts.cancelMostRecent();
};

export const promptInput = async options => {
  if (options && options.length) {
    promptMultiChoice(options);
  } else {
    promptFreeText();
  }
};

async function promptMultiChoice(options) {
  const choices = options.map(option => ({
    title: option.label
  }));
  promptPromise = prompts({
    type: "select",
    name: "choice",
    message: "Choose:",
    choices
  });
  const response = await promptPromise;
  promptPromise = null;

  const selected = options[response.choice];

  if (selected) {
    selected.action();
  }
}

async function promptFreeText() {
  promptPromise = prompts({
    type: "text",
    name: "input",
    message: "What do you want to do?",
    validate: input => (input ? true : "Do something!")
  });

  const response = await promptPromise;
  promptPromise = null;

  if (response && response.input && response.input.length) {
    receiveInput(response.input);
  }
}

export const showOptions = options => {
  const choices = options.map(option => option.label).join(", ");
  output(`Choose: ${choices}`);
};
