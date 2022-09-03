import { selectDebugMode } from "./selectors";

export const output = (text) => {
  console.log(text);
};

export const debug = (text) => {
  if (selectDebugMode()) {
    output(text);
  }
};

export const getOptionsString = (options) => {
  const choices = options.map((option) => option.label).join(", ");
  return `Choose: ${choices}`;
};
