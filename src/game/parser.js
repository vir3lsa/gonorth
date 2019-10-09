import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import Interaction from "./interaction";

const selectRoom = () => getStore().getState().game.game.room;
const selectVerbNames = () => getStore().getState().game.verbNames;
const selectVerb = verbName => getStore().getState().game.verbNames[verbName];
const selectItemNames = () => getStore().getState().game.itemNames;

export const parsePlayerInput = input => {
  const tokens = input
    .trim()
    .toLowerCase()
    .split(/\s+/);

  const room = selectRoom();

  // Record the possible matches we find
  let registeredVerb;
  let registeredItem;
  let roomItem;
  let message;

  for (let numWords = 1; numWords <= tokens.length; numWords++) {
    for (
      let verbIndex = 0;
      verbIndex <= tokens.length - numWords;
      verbIndex++
    ) {
      const possibleVerbWords = tokens.slice(verbIndex, verbIndex + numWords);
      const possibleVerb = possibleVerbWords.join(" ");

      // Is the verb registered globally?
      const verbExists = selectVerbNames().has(possibleVerb);
      registeredVerb = verbExists ? possibleVerb : registeredVerb;

      // Is the verb in the current room?
      const roomVerb = room.verbs[possibleVerb];

      if (roomVerb) {
        // The room has the verb, so do it
        return roomVerb.attempt(room);
      }

      const verbEndIndex = verbIndex + numWords;

      // Look for an item in what the player's typed
      for (
        let numItemWords = 1;
        numItemWords <= tokens.length - verbEndIndex;
        numItemWords++
      ) {
        for (
          let itemIndex = verbEndIndex;
          itemIndex < tokens.length;
          itemIndex++
        ) {
          const possibleItemWords = tokens.slice(
            itemIndex,
            itemIndex + numItemWords
          );
          const possibleItem = possibleItemWords.join(" ");

          // Is the item registered globally?
          const itemExists = selectItemNames().has(possibleItem);
          registeredItem = itemExists ? possibleItem : registeredItem;

          // Is the item in the room and visible? Does it support the verb?
          roomItem = room.items[possibleItem];

          if (roomItem && roomItem.visible && roomItem.verbs[possibleVerb]) {
            // The verb and item match so attempt the action
            return roomItem.try(possibleVerb);
          }
        }
      }
    }
  }

  if (registeredVerb) {
    if (roomItem) {
      // The item's in the room but doesn't support the verb
      message = `You can't see how to ${registeredVerb} the ${registeredItem}.`;
    } else if (registeredItem) {
      // The item exists elsewhere
      message = `You don't see a ${registeredItem} here.`;
    } else {
      // The item doesn't (yet) exist anywhere
      message = `You don't seem able to ${registeredVerb} that.`;
    }
  } else {
    if (roomItem) {
      // The item's in the room but the verb doesn't exist
      message = `You can't easily do that to the ${registeredItem}.`;
    } else if (registeredItem) {
      // The item's elsewhere
      message = `You don't see a ${registeredItem} here.`;
    } else {
      // Neither the verb nor the item exists
      message = `You shake your head in confusion.`;
    }
  }

  getStore().dispatch(changeInteraction(new Interaction(message)));
};
