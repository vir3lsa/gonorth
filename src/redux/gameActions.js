import * as type from "./gameActionTypes";

export const newGame = (game, inBrowser, debugMode) => ({
  type: type.NEW_GAME,
  payload: { game, inBrowser, debugMode }
});

export const changeInteraction = interaction => ({
  type: type.CHANGE_INTERACTION,
  payload: interaction
});

export const receivePlayerInput = input => ({
  type: type.RECEIVE_INPUT,
  payload: input
});
