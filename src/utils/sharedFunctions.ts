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
 * Gets the item from the store by name or alias, or returns the item if it's an object.
 * @param itemOrName The name or alias of the item, or the item itself.
 * @param index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 * @returns an item, if a matching one is found.
 */
export function resolveItem(itemOrName: Item | string, index = 0) {
  return typeof itemOrName === "string" ? [...(selectItem(itemOrName) || [])][index] : itemOrName;
}

/**
 * Returns true if the player has room in her inventory for the item.
 * @param itemOrName The name or alias of the item, or the item itself.
 * @param index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 */
export function playerCanCarry(itemOrName: Item | string, index = 0) {
  const item = resolveItem(itemOrName, index);
  const inventory = selectInventory();
  return (
    item && (inventory.capacity === -1 || inventory.free >= item.size) && !inventory.items[item.name.toLowerCase()]
  );
}



/**
 * Returns true if the player is carrying the item.
 * @param itemOrName The name or alias of the item, or the item itself.
 * @param index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 * @returns true if the player is carrying the item.
 */
export function playerHasItem(itemOrName: Item | string, index = 0) {
  return containerHasItem(selectInventory(), itemOrName, index);
}

/**
 * Returns true if the container item contains the second item.
 * @param containerOrName The name of alias of the container, or the container itself.
 * @param itemOrName The name or alias of the item, or the item itself.
 * @param containerIndex (Optional) The index of the container if there are multiple items with the provided alias. Defaults to 0.
 * @param itemIndex (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 * @returns true if the container item contains the second item.
 */
export function containerHasItem(
  containerOrName: Item | string,
  itemOrName: Item | string,
  containerIndex = 0,
  itemIndex = 0
) {
  const container = resolveItem(containerOrName, containerIndex);
  const item = resolveItem(itemOrName, itemIndex);
  return Boolean(container && item && container.items.hasOwnProperty(item.name.toLowerCase()));
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