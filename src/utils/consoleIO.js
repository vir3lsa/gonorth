export const output = text => {
  console.log(text);
};

export const promptInput = async options => {
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
  output(`Choose: ${choices}`);
};
