import { getStore } from "../redux/storeRegistry";

export const selectGame = () => getStore().getState().game;
export const selectInventory = () => getStore().getState().player;
export const selectPlayer = () => getStore().getState().player; // Deliberately same as above
// Pulls out the actual items from the inventory.
export const selectInventoryItems = () =>
  getStore()
    .getState()
    .player.itemArray.filter((item) => !item.doNotList);
export const selectRoom = () => getStore().getState().room;
export const selectVerbNames = () => getStore().getState().verbNames;
export const selectItemNames = () => getStore().getState().itemNames;
export const selectKeywords = () => getStore().getState().keywords;
export const selectLastChange = () => getStore().getState().lastChange;
export const selectTurn = () => getStore().getState().turn;
export const selectDebugMode = () => getStore().getState().debugMode;
export const selectOptions = () => getStore().getState().interaction.options;
export const selectRooms = () => getStore().getState().rooms;
export const selectAllItemNames = () => getStore().getState().allItemNames;
export const selectItems = () => getStore().getState().items;
export const selectAllItems = () => getStore().getState().allItems;
export const selectOptionGraphs = () => getStore().getState().optionGraphs;
export const selectConfig = () => getStore().getState().game.config;
export const selectActionChainPromise = () => getStore().getState().actionChainPromise;
export const selectEvents = () => getStore().getState().events;
export const selectRecordChanges = () => getStore().getState().recordChanges;
export const selectStartingRoom = () => getStore().getState().startingRoom;
export const selectCyCommands = () => getStore().getState().cyCommands;
export const selectEventTimeoutOverride = () => getStore().getState().eventTimeoutOverride;
export const selectEventTurnsOverride = () => getStore().getState().eventTurnsOverride;
export const selectEffects = () => getStore().getState().effects;
export const selectItem = (name) => getStore().getState().items[name];
export const selectAutoActions = () => getStore().getState().autoActions;
export const selectRollingLog = () => getStore().getState().rollingLog;
