import { selectDebugMode } from "./selectors";
import type { Option } from "../game/interactions/option";

export const output = (text: string) => {
  console.log(text);
};

export const debug = (text: string) => {
  if (selectDebugMode()) {
    output(text);
  }
};

export const getOptionsString = (options: Option[]) => {
  const choices = options.map((option) => option.label).join(", ");
  return `Choose: ${choices}`;
};
