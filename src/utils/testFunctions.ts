import { selectInteraction } from "./testSelectors";

export const clickNext = () => selectInteraction().options[0].action();

export const clickNextAndWait = () => {
  clickNext();
  return selectInteraction().promise;
};

export const deferAction = (action: SimpleAction, delayMillis?: number) => {
  let res: Consumer;
  const prom = new Promise((resolve) => (res = resolve));

  setTimeout(() => {
    action();
    res();
  }, delayMillis);

  return prom;
};
