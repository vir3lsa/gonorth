import { getStore } from "../redux/storeRegistry";
import { selectInteraction } from "./testSelectors";

export const clickNext = () => getStore().getState().game.interaction.options[0].action();

export const clickNextAndWait = () => {
  clickNext();
  return selectInteraction().promise;
};

export const deferAction = (action) => {
  let res;
  const prom = new Promise((resolve) => (res = resolve));
  setTimeout(() => {
    action();
    res();
  });
  return prom;
};