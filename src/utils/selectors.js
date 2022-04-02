import { getStore } from "../redux/storeRegistry";

export const selectGame = () => getStore().getState().game.game;
export const selectInventory = () => getStore().getState().game.game.player;
export const selectPlayer = () => getStore().getState().game.game.player; // Deliberately same as above
// Pulls out the actual items from the inventory.
export const selectInventoryItems = () =>
  getStore()
    .getState()
    .game.game.player.itemArray.filter((item) => !item.doNotList);
export const selectRoom = () => getStore().getState().game.game.room;
export const selectVerbNames = () => getStore().getState().game.verbNames;
export const selectItemNames = () => getStore().getState().game.itemNames;
export const selectKeywords = () => getStore().getState().game.keywords;
export const selectLastChange = () => getStore().getState().game.lastChange;
export const selectTurn = () => getStore().getState().game.turn;
export const selectDebugMode = () => getStore().getState().game.debugMode;
export const selectOptions = () => getStore().getState().game.interaction.options;
export const selectRooms = () => getStore().getState().game.rooms;
export const selectAllItemNames = () => getStore().getState().game.allItemNames;
export const selectItems = () => getStore().getState().game.items;
export const selectOptionGraphs = () => getStore().getState().game.optionGraphs;
