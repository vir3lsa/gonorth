import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import { Append } from "./interaction";
import {
  selectVerbNames,
  selectRoom,
  selectItemNames,
  selectInventory,
  selectKeywords
} from "../utils/selectors";

// Record the possible matches we find
let registeredItem;

export class Parser {
  constructor(input) {
    this.input = input;
    this.registeredItem = null;
    this.registeredVerb = null;
    this.roomItem = null;
  }

  parse() {
    const tokens = this.input
      .trim()
      .toLowerCase()
      .split(/\s+/);

    const room = selectRoom();

    for (let numWords = tokens.length; numWords > 0; numWords--) {
      for (
        let verbIndex = 0;
        verbIndex <= tokens.length - numWords;
        verbIndex++
      ) {
        const possibleVerbWords = tokens.slice(verbIndex, verbIndex + numWords);
        const possibleVerb = possibleVerbWords.join(" ");

        // Is the verb registered globally?
        const canonicalVerb = selectVerbNames()[possibleVerb];
        this.registeredVerb = canonicalVerb || this.registeredVerb;
        const verbEndIndex = verbIndex + numWords;

        // If the player hasn't included an item, try keywords and the current room
        if (verbEndIndex === tokens.length) {
          // Is the verb a keyword?
          const keyword = selectKeywords()[possibleVerb];

          if (keyword) {
            return keyword.attempt();
          }

          // Is the verb in the current room?
          const roomVerb = room.verbs[possibleVerb];

          if (roomVerb) {
            // The room has the verb, so do it
            return roomVerb.attempt(room);
          }
        }

        const items = this.findRoomItems(tokens, verbEndIndex);

        if (items && items.length) {
          const item = items[0];
          this.roomItem = item || this.roomItem;

          if (item && item.visible && item.verbs[possibleVerb]) {
            if (item.verbs[possibleVerb].prepositional) {
              const indirectItem = items[1];

              if (indirectItem && indirectItem.visible) {
                return item.try(possibleVerb, indirectItem);
              }
            } else {
              return item.try(possibleVerb);
            }
          }
        }
      }
    }

    return this.giveFeedback();
  }

  findRoomItems(tokens, verbEndIndex) {
    const room = selectRoom();
    const items = [];

    for (
      let numItemWords = tokens.length - verbEndIndex;
      numItemWords > 0;
      numItemWords--
    ) {
      for (
        let itemIndex = verbEndIndex;
        itemIndex <= tokens.length - numItemWords;
        itemIndex++
      ) {
        const endIndex = itemIndex + numItemWords;
        const possibleItemWords = tokens.slice(itemIndex, endIndex);
        const possibleItem = possibleItemWords.join(" ");

        if (!items.length) {
          // Is the first item registered globally?
          const itemExists = selectItemNames().has(possibleItem);
          this.registeredItem = itemExists ? possibleItem : this.registeredItem;
        }

        // Is the item in the room and visible? Does it support the verb?
        const item = room.accessibleItems[possibleItem];

        if (item && item.visible) {
          // The verb and item match so stop looking
          this.recordItem(item, items, itemIndex);
        } else {
          // Try items in the player's inventory instead
          const inventoryItem = selectInventory().items[possibleItem];

          if (inventoryItem) {
            this.recordItem(inventoryItem, items, itemIndex);
          }
        }

        if (items.length > 1) {
          return items.map(itemEntry => itemEntry[0]);
        }
      }
    }

    return items.map(itemEntry => itemEntry[0]);
  }

  recordItem(item, items, itemIndex) {
    if (items.length) {
      if (itemIndex < items[0][1]) {
        return items.unshift([item, itemIndex]);
      }
    }

    return items.push([item, itemIndex]);
  }

  giveFeedback() {
    let message;

    if (this.registeredVerb) {
      if (this.roomItem) {
        // The item's in the room but doesn't support the verb
        message = `You can't see how to ${this.registeredVerb} the ${this.registeredItem}.`;
      } else if (this.registeredItem) {
        // The item exists elsewhere
        message = `You don't see a ${this.registeredItem} here.`;
      } else {
        // The item doesn't (yet) exist anywhere
        message = `You don't seem able to ${this.registeredVerb} that.`;
      }
    } else {
      if (this.roomItem) {
        // The item's in the room but the verb doesn't exist
        message = `You can't easily do that to the ${this.registeredItem}.`;
      } else if (this.registeredItem) {
        // The item's elsewhere
        message = `You don't see a ${this.registeredItem} here.`;
      } else {
        // Neither the verb nor the item exists
        message = `You shake your head in confusion.`;
      }
    }

    return getStore().dispatch(changeInteraction(new Append(message)));
  }
}
