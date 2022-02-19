import { selectInventory, selectLastChange, selectPlayer, selectRoom } from "./selectors";
import { Room } from "../game/items/room";

const REACTION_MILLIS = 350;

// Check the player has had time to react to new output before accepting input
export function reactionTimePassed() {
  const millisElapsed = Date.now() - selectLastChange();
  return millisElapsed > REACTION_MILLIS;
}

/*
 * Returns true if the item is in the same room as the player.
 */
export function inSameRoomAs(item) {
  // If the item is in the player's inventory, return true immediately.
  const inventoryItemsWithName = selectPlayer().items[item.name];
  if (inventoryItemsWithName && inventoryItemsWithName.includes(item)) {
    return true;
  }

  const room = selectRoom();
  let possibleItemRoom = item.container;
  let itemRoom;

  while (possibleItemRoom !== null && !(possibleItemRoom instanceof Room)) {
    possibleItemRoom = possibleItemRoom.container;
  }

  if (possibleItemRoom !== null) {
    itemRoom = possibleItemRoom;
  }

  return room === itemRoom;
}

/*
 * Returns true if the player has room in her inventory for the item.
 */
export function playerCanCarry(item) {
  const inventory = selectInventory();
  return (inventory.capacity === -1 || inventory.free >= item.size) && !inventory.items[item.name.toLowerCase()];
}
