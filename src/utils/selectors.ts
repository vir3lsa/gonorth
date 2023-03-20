import { getStore } from "../redux/storeRegistry";

export const selectGame = (): Game => getStore().getState().game;
export const selectInventory = (): ItemT => getStore().getState().player;
export const selectPlayer = (): ItemT => getStore().getState().player; // Deliberately same as above
// Pulls out the actual items from the inventory.
export const selectInventoryItems = (): ItemT[] =>
  getStore()
    .getState()
    .player.itemArray.filter((item: ItemT) => !item.doNotList);
export const selectRoom = (): RoomT => getStore().getState().room;
export const selectVerbNames = (): VerbNameDict => getStore().getState().verbNames;
export const selectItemNames = (): Set<string> => getStore().getState().itemNames;
export const selectKeywords = (): Keywords => getStore().getState().keywords;
export const selectLastChange = (): number => getStore().getState().lastChange;
export const selectTurn = (): number => getStore().getState().turn;
export const selectDebugMode = (): boolean => getStore().getState().debugMode;
export const selectOptions = (): OptionT[] => getStore().getState().interaction.options;
export const selectRooms = (): RoomDict => getStore().getState().rooms;
export const selectAllItemNames = (): Set<string> => getStore().getState().allItemNames;
export const selectItems = (): ItemAliasDict => getStore().getState().items;
export const selectAllItems = (): Set<ItemT> => getStore().getState().allItems;
export const selectOptionGraphs = (): OptionGraphDict => getStore().getState().optionGraphs;
export const selectOptionGraph = (name: string): OptionGraphT => getStore().getState().optionGraphs[name];
export const selectConfig = (): Config => getStore().getState().game.config;
export const selectActionChainPromise = (): Promise<string> => getStore().getState().actionChainPromise;
export const selectEvents = (): EventT[] => getStore().getState().events;
export const selectRecordChanges = (): boolean => getStore().getState().recordChanges;
export const selectStartingRoom = (): RoomT => getStore().getState().startingRoom;
export const selectCyCommands = (): string[] => getStore().getState().cyCommands;
export const selectEventTimeoutOverride = (): number | undefined => getStore().getState().eventTimeoutOverride;
export const selectEventTurnsOverride = (): number | undefined => getStore().getState().eventTurnsOverride;
export const selectEffects = (): EffectsT => getStore().getState().effects;
export const selectItem = (name: string): Set<ItemT> => getStore().getState().items[name];
export const selectAutoActions = (): AutoActionT[] => getStore().getState().autoActions;
export const selectRollingLog = (): LogEntry[] => getStore().getState().rollingLog;
