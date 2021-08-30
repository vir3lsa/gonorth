import { SequentialText } from "../game/interactions/text";
import { selectGame } from "./selectors";

export const defaultHelp = () => new SequentialText(`Welcome to ${selectGame().title}.`);
