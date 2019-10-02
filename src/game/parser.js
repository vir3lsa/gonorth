import { getStore } from "../redux/storeRegistry";

const selectRoom = () => getStore().getState().game.game.room;

export const parsePlayerInput = input => {
  const tokens = input
    .trim()
    .toLowerCase()
    .split(/\s+/);

  // First look for verbs available in the current room
  const possibleVerb = tokens[0];
  const room = selectRoom();
  const roomVerb = room.verbs[possibleVerb];

  if (roomVerb) {
    // The room has the verb, so do it
    return roomVerb.attempt(room);
  }

  // Next look for items in the room that support the verb
  const possibleItems = Object.values(room.items).filter(
    item => item.verbs[possibleVerb]
  );

  // Find the item (if any) that matches what the player has typed
  const matchingItem = possibleItems.find(item => {
    const itemNameParts = item.name.toLowerCase().split(/\s+/);
    const numNameParts = itemNameParts.length;

    for (
      let tokenIndex = 1;
      tokenIndex <= tokens.length - numNameParts;
      tokenIndex++
    ) {
      const possibleNameParts = tokens.slice(
        tokenIndex,
        tokenIndex + numNameParts
      );
      const matchFound = possibleNameParts.every(
        (part, i) => part === itemNameParts[i]
      );

      if (matchFound) {
        return true;
      }
    }
  });

  if (matchingItem) {
    // We think the player is referring to this item, so do it
    matchingItem.try(possibleVerb);
  }
};
