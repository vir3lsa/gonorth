import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import { Append } from "./interactions/interaction";
import {
  selectVerbNames,
  selectRoom,
  selectItemNames,
  selectInventory,
  selectKeywords
} from "../utils/selectors";
import { toTitleCase, getArticle } from "../utils/textFunctions";

export class Parser {
  constructor(input) {
    this.input = input;
    this.registeredItem = null;
    this.registeredVerb = null;
    this.actualVerb = null;
    this.verbSupported = false;
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
          const itemsWithName = items[0];

          if (itemsWithName.length > 1) {
            return this.handleDuplicateAliases();
          }

          const item = itemsWithName[0];
          this.roomItem = item || this.roomItem;

          if (item && item.visible && item.verbs[possibleVerb]) {
            this.actualVerb = item.verbs[possibleVerb];
            this.verbSupported = true;

            if (this.actualVerb.prepositional) {
              const indirectItemsWithName = items[1];

              if (indirectItemsWithName) {
                if (indirectItemsWithName.length > 1) {
                  return this.handleDuplicateAliases();
                }

                const indirectItem = indirectItemsWithName[0];

                if (indirectItem && indirectItem.visible) {
                  return item.try(possibleVerb, indirectItem);
                }
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
        const itemsWithName = room.accessibleItems[possibleItem]?.filter(
          item => item.visible
        );

        if (itemsWithName?.length) {
          this.recordItems(itemsWithName, items, itemIndex);
        } else {
          // Try items in the player's inventory instead
          const inventoryItems = selectInventory().items[possibleItem];

          if (inventoryItems) {
            this.recordItems(inventoryItems, items, itemIndex);
          }
        }

        if (items.length > 1) {
          return items.map(itemEntry => itemEntry[0]);
        }
      }
    }

    return items.map(itemEntry => itemEntry[0]);
  }

  recordItems(itemsWithName, items, itemIndex) {
    if (items.length) {
      if (itemIndex < items[0][1]) {
        return items.unshift([itemsWithName, itemIndex]);
      }
    }

    return items.push([itemsWithName, itemIndex]);
  }

  giveFeedback() {
    let message;

    if (this.registeredVerb) {
      if (this.roomItem) {
        if (!this.actualVerb) {
          this.findActualVerb();
        }

        if (this.verbSupported) {
          // Prepositional verb missing a second item
          message = `${toTitleCase(this.registeredVerb)} the ${
            this.registeredItem
          } ${this.actualVerb.interrogative}?`;
        } else if (this.actualVerb && this.actualVerb.prepositional) {
          // Prepositional verb with missing (or unsupported) first item
          message = `You can't ${this.registeredVerb} that ${
            this.roomItem.preposition
          } the ${this.registeredItem}.`;
        } else {
          // The item's in the room but doesn't support the verb
          message = `You can't see how to ${this.registeredVerb} the ${
            this.registeredItem
          }.`;
        }
      } else if (this.registeredItem) {
        // The item exists elsewhere
        message = `You don't see ${getArticle(this.registeredItem)} ${
          this.registeredItem
        } here.`;
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
        message = `You don't see ${getArticle(this.registeredItem)} ${
          this.registeredItem
        } here.`;
      } else {
        // Neither the verb nor the item exists
        message = `You shake your head in confusion.`;
      }
    }

    return getStore().dispatch(changeInteraction(new Append(message)));
  }

  /*
   * Used to give feedback when the items the player has referred to don't support the verb.
   * Instead, find a matching verb on items in the room or in the player's inventory.
   */
  findActualVerb() {
    this.actualVerb =
      this.findActualVerbIn(selectRoom().accessibleItems) ||
      this.findActualVerbIn(selectInventory().items);
  }

  findActualVerbIn(itemMap) {
    const itemArrays = Object.values(itemMap);

    // Use normal for loop so we can return from inside it
    for (let items of itemArrays) {
      const itemWithVerb = items.find(item => item.verbs[this.registeredVerb]);

      if (itemWithVerb) {
        return itemWithVerb.verbs[this.registeredVerb];
      }
    }
  }

  handleDuplicateAliases() {
    // Multiple items with the same name/alias
    // TODO The message will work for the primary item, but not the
    // secondary item as it isn't recorded
    return getStore().dispatch(
      changeInteraction(new Append(`Which ${this.registeredItem} do you mean?`))
    );
  }
}
