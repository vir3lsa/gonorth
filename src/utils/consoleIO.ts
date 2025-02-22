import { selectDebugMode } from "./selectors";
import type { Option } from "../game/interactions/option";

export const output = (text: string, error?: boolean, warn?: boolean) => {
  if (error) {
    console.error(text);
  } else if (warn) {
    console.warn(text);
  } else {
    console.log(text);
  }
};

export const debug = (text: string, error?: boolean, warn?: boolean) => {
  if (selectDebugMode()) {
    output(text, error, warn);
  }
};

export const getOptionsString = (options: Option[]) => {
  const choices = options.map((option) => option.label).join(", ");
  return `Choose: ${choices}`;
};
