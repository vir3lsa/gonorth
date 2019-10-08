import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import Interaction from "./interaction";

const selectRoom = () => getStore().getState().game.game.room;
const selectVerbNames = () => getStore().getState().game.verbNames;

export const parsePlayerInput = input => {
  const tokens = input
    .trim()
    .toLowerCase()
    .split(/\s+/);

  const room = selectRoom();

  // Record if we find a verb that's supported by items in the room
  let supportedVerb;
  let supportingItems;
  let verbEndIndex;

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

      if (possibleItemNames.length) {
        // The verb is supported by items in the room
        supportedVerb = possibleVerb;
        supportingItems = possibleItemNames;
        verbEndIndex = verbIndex + numWords;
      }

      // Find the item (if any) that matches what the player has typed
      const matchingItemName = possibleItemNames.find(itemName => {
        return doesItemMatch(itemName, tokens, verbIndex + numWords);
      });

      if (matchingItemName) {
        const matchingItem = room.items[matchingItemName];
        // We think the player is referring to this item, so do it
        return matchingItem.try(possibleVerb);
      }
    }
  }

  // No verb/item combination was found. Construct a response.
  constructFailureResponse(
    supportedVerb,
    room,
    supportingItems,
    tokens,
    verbEndIndex
  );
};

/**
 * Dispatches a failure response when no matching verb/item combination was found.
 */
function constructFailureResponse(
  supportedVerb,
  room,
  supportingItems,
  tokens,
  verbEndIndex
) {
  let message = "";
  if (supportedVerb) {
    // Try items that don't support verb to see if player is referring to them
    const untestedItemNames = Object.keys(room.items).reduce(
      (acc, itemName) => {
        if (!supportingItems.includes(itemName)) {
          acc.push(itemName);
        }
        return acc;
      },
      []
    );
    const matchingItem = untestedItemNames.find(itemName => {
      return doesItemMatch(itemName, tokens, verbEndIndex);
    });
    if (matchingItem) {
      message = `You fail to ${supportedVerb} the ${matchingItem}.`;
    } else {
      message = `There's nothing like that to ${supportedVerb}.`;
    }
  } else {
    // No verb was found. Is there a match in the global list?
    let globalVerb;
    let itemStartIndex = 0;

    for (let numWords = 1; numWords <= tokens.length; numWords++) {
      for (
        let verbIndex = 0;
        verbIndex <= tokens.length - numWords;
        verbIndex++
      ) {
        const possibleVerbWords = tokens.slice(verbIndex, verbIndex + numWords);
        const possibleVerb = possibleVerbWords.join(" ");
        const globalMatch = selectVerbNames().has(possibleVerb);

        if (globalMatch) {
          globalVerb = possibleVerb;
          itemStartIndex = verbIndex + numWords;
        }
      }
    }

    //Did the player refer to an item in the room?
    const matchingItem = Object.keys(room.items).find(itemName => {
      return doesItemMatch(itemName, tokens, itemStartIndex);
    });

    if (globalVerb) {
      if (matchingItem) {
        message = `You can't see how to ${globalVerb} the ${matchingItem}.`;
      } else {
        message = `You don't seem able to ${globalVerb} that.`;
      }
    } else {
      if (matchingItem) {
        message = `You can't easily do that to the ${matchingItem}.`;
      } else {
        message = `You shake your head in confusion.`;
      }
    }
  }

  getStore().dispatch(changeInteraction(new Interaction(message)));
}

/**
 * Determines whether the item's name matches the user input.
 */
function doesItemMatch(itemName, tokens, startIndex) {
  const itemNameParts = itemName.toLowerCase().split(/\s+/);
  const numNameParts = itemNameParts.length;

  for (
    let itemIndex = startIndex;
    itemIndex <= tokens.length - numNameParts;
    itemIndex++
  ) {
    const possibleNameParts = tokens.slice(itemIndex, itemIndex + numNameParts);
    const matchFound = possibleNameParts.every(
      (part, i) => part === itemNameParts[i]
    );

    if (matchFound) {
      return true;
    }
  }
}
