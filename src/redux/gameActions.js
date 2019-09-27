import * as type from "./gameActionTypes";

export const newGame = (inBrowser, debugMode) => ({
  type: type.NEW_GAME,
  payload: { inBrowser, debugMode }
});

export const changeInteraction = interaction => ({
  type: type.CHANGE_INTERACTION,
  payload: interaction
});
