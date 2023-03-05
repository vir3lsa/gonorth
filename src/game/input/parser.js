import { getStore } from "../../redux/storeRegistry";
import { changeInteraction } from "../../redux/gameActions";
import { Append } from "../interactions/interaction";
import { selectVerbNames, selectRoom, selectItemNames, selectInventory, selectKeywords } from "../../utils/selectors";
import { toTitleCase, getArticle } from "../../utils/textFunctions";
import disambiguate from "../../utils/disambiguation";

export class Parser {
  constructor(input) {
    this.input = input;
    this.registeredItem = undefined;
    this.registeredVerb = undefined;
    this.actualVerb = undefined;
    this.verbSupported = false;
    this.roomItem = undefined;
    this.indirectItem = undefined;
    this.duplicateAliasItems = undefined;
    this.duplicateAlias = undefined;
    this.duplicateItemIsPrimary = true;
    this.tooManyDuplicates = false;
  }

  parse() {
    const tokens = this.input.trim().toLowerCase().split(/\s+/);

    if (tokens[0] === "debug") {
      // Need case-sensitive args for the debug command.
      const args = this.input.trim().split(/\s+/).slice(1);
      return selectKeywords().debug.attempt(args[0], args.slice(1));
    }

    const room = selectRoom();

    for (let numWords = tokens.length; numWords > 0; numWords--) {
      for (let verbIndex = 0; verbIndex <= tokens.length - numWords; verbIndex++) {
        const possibleVerbWords = tokens.slice(verbIndex, verbIndex + numWords);
        const possibleVerb = possibleVerbWords.join(" ");

        // Is the verb registered globally?
        const canonicalVerb = selectVerbNames()[possibleVerb];
        this.registeredVerb = canonicalVerb || this.registeredVerb;
        const verbEndIndex = verbIndex + numWords;

        // Is the verb a keyword?
        const keyword = selectKeywords()[possibleVerb];

        // If the player hasn't included an item (or a matching keywords expects extra args), try keywords and the current room
        if (verbEndIndex === tokens.length || keyword?.expectsArgs) {
          if (keyword) {
            // Invoke keyword action, passing extra args for benefit of those that expect them.
            return keyword.attempt(...tokens.slice(verbEndIndex));
          }

          // Is the verb in the current room?
          const roomVerb = room.verbs[possibleVerb];

          if (roomVerb) {
            // The room has the verb, so do it
            return roomVerb.attempt(room);
          }
        }

        const itemDetails = this.findRoomItems(tokens, verbEndIndex);

        if (itemDetails && itemDetails.length) {
          const { alias, itemsWithName } = itemDetails[0];

          const validItemsWithName = itemsWithName.filter((item) => item?.visible && item.verbs[possibleVerb]);

          if (!validItemsWithName.length) {
            this.roomItem = itemsWithName[0] || this.roomItem; // Record a room item for feedback purposes.
          }

          for (let itemIndex in validItemsWithName) {
            const item = validItemsWithName[itemIndex];
            this.roomItem = item || this.roomItem; // Record a valid room item.

            this.actualVerb = item.verbs[possibleVerb];
            this.verbSupported = true;
            let indirectItemsWithName, indirectItem, indirectAlias;
            let validCombination = true;

            // Do we have a valid indirect item?
            indirectAlias = itemDetails[1]?.alias;
            indirectItemsWithName = itemDetails[1]?.itemsWithName;

            if (indirectItemsWithName) {
              indirectItem = indirectItemsWithName[0];

              if (indirectItem && indirectItem.visible) {
                this.indirectItem = indirectItem;
              }
            }

            if (this.actualVerb.prepositional && !this.actualVerb.prepositionOptional && !this.indirectItem) {
              validCombination = false;
            }

            if (validCombination) {
              if (validItemsWithName.length > 1) {
                // Primary item name is a duplicate
                this.recordDuplicates(validItemsWithName, alias, true);
              }

              if (indirectItemsWithName?.length > 1) {
                // Secondary item name is a duplicate
                this.recordDuplicates(indirectItemsWithName, indirectAlias, false);
              }

              if (validItemsWithName.length > 1 || indirectItemsWithName?.length > 1) {
                // If we have any duplicates we need to disambiguate.
                return this.giveFeedback();
              }

              // If there's no effect registered (or no indirect item), try the verb as usual.
              return item.try(possibleVerb, this.indirectItem);
            }
          }
        }
      }
    }

    return this.giveFeedback();
  }

  recordDuplicates(itemsWithName, name, isPrimary) {
    if (!this.duplicateAlias) {
      this.duplicateAliasItems = itemsWithName;
      this.duplicateAlias = name;
      this.duplicateItemIsPrimary = isPrimary;
    } else {
      this.tooManyDuplicates = true;
    }
  }

  findRoomItems(tokens, verbEndIndex) {
    const room = selectRoom();
    const itemDetails = [];
    const usedIndices = []; // Keep track of token indices we've found items at

    for (let numItemWords = tokens.length - verbEndIndex; numItemWords > 0; numItemWords--) {
      for (let itemIndex = verbEndIndex; itemIndex <= tokens.length - numItemWords; itemIndex++) {
        if (usedIndices.includes(itemIndex)) {
          // Don't try indices we've already found items at
          continue;
        }

        const endIndex = itemIndex + numItemWords;
        const possibleItemWords = tokens.slice(itemIndex, endIndex);
        const possibleItem = possibleItemWords.join(" ");

        if (!itemDetails.length) {
          // Is the item registered globally?
          const itemExists = selectItemNames().has(possibleItem);

          if (itemExists && (!this.registeredItem || possibleItem.length > this.registeredItem.length)) {
            this.registeredItem = possibleItem;
          }
        }

        // Is the item in the room and visible? Does it support the verb?
        let itemsWithName = room.accessibleItems[possibleItem]?.filter((item) => item.visible) || [];

        // Try items in the player's inventory as well
        const inventoryItems = selectInventory().accessibleItems[possibleItem]?.filter((item) => item.visible);

        if (inventoryItems) {
          itemsWithName = [...itemsWithName, ...inventoryItems];
        }

        if (itemsWithName?.length) {
          this.recordItems(possibleItem, itemsWithName, itemDetails, itemIndex, numItemWords, usedIndices);
        }

        // Once we have two items, stop looking. Should we keep looking, in case of false positives?
        if (itemDetails.length > 1) {
          return itemDetails;
        }
      }
    }

    return itemDetails;
  }

  recordItems(alias, itemsWithName, itemDetails, itemIndex, numItemWords, usedIndices) {
    // Record indices of this item so we don't try to find other items there
    for (let i = itemIndex; i < itemIndex + numItemWords; i++) {
      usedIndices.push(i);
    }

    if (itemDetails.length) {
      if (itemIndex < itemDetails[0].itemIndex) {
        return itemDetails.unshift({ alias, itemsWithName, itemIndex });
      }
    }

    return itemDetails.push({ alias, itemsWithName, itemIndex });
  }

  async giveFeedback() {
    let message;

    if (this.registeredVerb) {
      if (this.roomItem) {
        if (!this.actualVerb) {
          this.findActualVerb();
        }

        if (this.duplicateAliasItems) {
          // Player must be more specific
          return this.handleDuplicateAliases();
        } else if (this.verbSupported) {
          // Prepositional verb missing a second item
          message = `${toTitleCase(this.registeredVerb)} the ${this.registeredItem} ${this.actualVerb.interrogative}?`;
        } else if (this.actualVerb && this.actualVerb.prepositional) {
          // Prepositional verb with missing (or unsupported) first item
          message = `You can't ${this.registeredVerb} that ${this.roomItem.preposition} the ${this.registeredItem}.`;
        } else {
          // The item's in the room but doesn't support the verb
          message = `You can't see how to ${this.registeredVerb} the ${this.registeredItem}.`;
        }
      } else if (this.registeredItem) {
        // The item exists elsewhere
        message = `You don't see ${getArticle(this.registeredItem)} ${this.registeredItem} here.`;
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
        message = `You don't see ${getArticle(this.registeredItem)} ${this.registeredItem} here.`;
      } else {
        // Neither the verb nor the item exists
        message = `You shake your head in confusion.`;
      }
    }

    // Display the message.
    await getStore().dispatch(changeInteraction(new Append(message)));

    // Indicate the action failure.
    return false;
  }

  /*
   * Used to give feedback when the items the player has referred to don't support the verb.
   * Instead, find a matching verb on items in the room or in the player's inventory.
   */
  findActualVerb() {
    this.actualVerb =
      this.findActualVerbIn(selectRoom().accessibleItems) || this.findActualVerbIn(selectInventory().items);
  }

  findActualVerbIn(itemMap) {
    const itemArrays = Object.values(itemMap);

    // Use normal for loop so we can return from inside it
    for (let items of itemArrays) {
      const itemWithVerb = items.find((item) => item.verbs[this.registeredVerb]);

      if (itemWithVerb) {
        return itemWithVerb.verbs[this.registeredVerb];
      }
    }
  }

  handleDuplicateAliases() {
    if (this.tooManyDuplicates) {
      // We're not even going to try to handle this situation. Too complicated.
      return getStore().dispatch(changeInteraction(new Append("You need to be more specific.")));
    }

    const onChoose = (item) => {
      if (this.duplicateItemIsPrimary) {
        return item.try(this.actualVerb.name, this.indirectItem);
      } else {
        return this.roomItem.try(this.actualVerb.name, item);
      }
    };

    return disambiguate(this.duplicateAlias, this.duplicateAliasItems, onChoose);
  }
}
