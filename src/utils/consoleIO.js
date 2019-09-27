export const output = text => {
  console.log(text);
};

let prompts;

export const promptInput = async options => {
  if (!prompts) {
    // Lazily load this module to avoid breaking in browser
    try {
      prompts = require("prompts");
    } catch (e) {
      console.log(e);
    }
  }

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
};

export const showOptions = options => {
  const choices = options.map(option => option.label).join(", ");
  console.log(`Choose: ${choices}`);
};
