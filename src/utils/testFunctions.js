import { getStore } from "../redux/storeRegistry";
import { selectInteraction } from "./testSelectors";

export const clickNext = () => getStore().getState().game.interaction.options[0].action();

export const clickNextAndWait = () => {
  clickNext();
  return selectInteraction().promise;
};
