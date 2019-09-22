import { NEW_GAME, CHANGE_INTERACTION } from "./gameActionTypes";

export const newGame = (inBrowser, debugMode) => ({
  type: NEW_GAME,
  payload: { inBrowser, debugMode }
});

export const changeInteraction = interaction => ({
  type: CHANGE_INTERACTION,
  payload: interaction
});
