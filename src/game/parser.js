import { getStore } from "../redux/storeRegistry";
import { receivePlayerInput } from "../redux/gameActions";

const selectRoom = () => getStore().getState().game.game.room;

export const parsePlayerInput = input => {
  const tokens = input
    .trim()
    .toLowerCase()
    .split(/\s+/);

  const room = selectRoom();

  for (let numWords = 1; numWords <= tokens.length; numWords++) {
    for (
      let verbIndex = 0;
      verbIndex <= tokens.length - numWords;
      verbIndex++
    ) {
      const possibleVerbWords = tokens.slice(verbIndex, verbIndex + numWords);
      const possibleVerb = possibleVerbWords.join(" ");

      // First look for verbs available in the current room
      const roomVerb = room.verbs[possibleVerb];

      if (roomVerb) {
        // The room has the verb, so do it
        return roomVerb.attempt(room);
      }

      // Next look for items in the room that support the verb
      const possibleItemNames = Object.entries(room.items)
        .filter(([, item]) => item.verbs[possibleVerb])
        .map(([itemName]) => itemName);

      // Find the item (if any) that matches what the player has typed
      const matchingItemName = possibleItemNames.find(itemName => {
        const itemNameParts = itemName.toLowerCase().split(/\s+/);
        const numNameParts = itemNameParts.length;

        for (
          let itemIndex = verbIndex + numWords;
          itemIndex <= tokens.length - numNameParts;
          itemIndex++
        ) {
          const possibleNameParts = tokens.slice(
            itemIndex,
            itemIndex + numNameParts
          );
          const matchFound = possibleNameParts.every(
            (part, i) => part === itemNameParts[i]
          );

          if (matchFound) {
            return true;
          }
        }
      });

      if (matchingItemName) {
        const matchingItem = room.items[matchingItemName];
        // We think the player is referring to this item, so do it
        return matchingItem.try(possibleVerb);
      }
    }
  }
};
