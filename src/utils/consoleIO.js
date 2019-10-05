import { getStore } from "../redux/storeRegistry";
import { receivePlayerInput } from "../redux/gameActions";
import { receiveInput } from "./inputReceiver";

export const output = text => {
  console.log(text);
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
  const response = await prompts({
    type: "select",
    name: "choice",
    message: "Choose:",
    choices
  });
  const selected = options[response.choice];
  selected.action();
}

async function promptFreeText() {
  const response = await prompts({
    type: "text",
    name: "input",
    message: "What do you want to do?",
    validate: input => (input ? true : "Do something!")
  });

  receiveInput(response.input);
}

export const showOptions = options => {
  const choices = options.map(option => option.label).join(", ");
  output(`Choose: ${choices}`);
};
