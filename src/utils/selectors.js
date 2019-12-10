import { getStore } from "../redux/storeRegistry";

export const selectGame = () => getStore().getState().game.game;
export const selectInventory = () => getStore().getState().game.game.player;
export const selectRoom = () => getStore().getState().game.game.room;
export const selectVerbNames = () => getStore().getState().game.verbNames;
export const selectItemNames = () => getStore().getState().game.itemNames;
export const selectKeywords = () => getStore().getState().game.keywords;
