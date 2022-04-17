import { selectDebugMode } from "./selectors";

export const output = (text) => {
  console.log(text);
};

export const debug = (text) => {
  if (selectDebugMode()) {
    output(text);
  }
};

export const showOptions = (options) => {
  const choices = options.map((option) => option.label).join(", ");
  output(`Choose: ${choices}`);
};
