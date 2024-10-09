import { AnyAction } from "redux";
import { selectConfig, selectInventory, selectItem, selectLastChange, selectPlayer, selectRoom } from "./selectors";
import type { Item } from "../game/items/item";
import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import { Interaction } from "../game/interactions/interaction";

const REACTION_MILLIS = 350;

// Check the player has had time to react to new output before accepting input
export function reactionTimePassed() {
  if (selectConfig().skipReactionTimes) {
    return true;
  }

  const millisElapsed = Date.now() - selectLastChange();
  return millisElapsed > REACTION_MILLIS;
}

/*
 * Returns true if the item is in the same room as the player.
 */
export function inSameRoomAs(item: Item) {
  // If the item is in the player's inventory, return true immediately.
  const inventoryItemsWithName = selectPlayer().items[item.name];
  if (inventoryItemsWithName && inventoryItemsWithName.includes(item)) {
    return true;
  }

  const room = selectRoom();
  let possibleItemRoom = item.container;
  let itemRoom;

  while (possibleItemRoom && !possibleItemRoom.isRoom) {
    possibleItemRoom = possibleItemRoom.container;
  }

  if (possibleItemRoom !== null) {
    itemRoom = possibleItemRoom;
  }

  return room === itemRoom;
}

/**
 * Returns true if the player has room in her inventory for the item.
 * @param itemOrName The name or alias of the item, or the item itself.
 * @param index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 */
export function playerCanCarry(itemOrName: Item | string, index = 0) {
  const item = typeof itemOrName === "string" ? [...selectItem(itemOrName)][index] : itemOrName;
  const inventory = selectInventory();
  return (inventory.capacity === -1 || inventory.free >= item.size) && !inventory.items[item.name.toLowerCase()];
}

/**
 * Returns true if the player is carrying the item.
 * @param itemOrName The name or alias of the item, or the item itself.
 * @param index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 */
export function playerHasItem(itemOrName: Item | string, index = 0) {
  const item = typeof itemOrName === "string" ? [...selectItem(itemOrName)][index] : itemOrName;
  const inventory = selectInventory();
  return inventory.items.hasOwnProperty(item.name.toLowerCase());
}

/*
 * Clears the page of text output.
 */
export function clearPage(newPage: string = "") {
  getStore().dispatch(changeInteraction(new Interaction(newPage)) as unknown as AnyAction);
}

/*
 * Returns true if the player is in the named room.
 */
export function inRoom(roomName: string) {
  return selectRoom().name.toLocaleLowerCase() === roomName.toLocaleLowerCase();
}

/**
 * Turns a Test into a TestFunction.
 * @param test The input Test
 * @returns TestFunction
 */
export const normaliseTest = (test?: Test) => {
  if (typeof test === "undefined") {
    return () => true;
  } else if (typeof test === "boolean") {
    return () => test;
  }

  return test;
};