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
import { OptionGraph } from "./interactions/optionGraph";

export class Parser {
  constructor(input) {
    this.input = input;
    this.registeredItem = null;
    this.registeredVerb = null;
    this.actualVerb = null;
    this.verbSupported = false;
    this.roomItem = null;
    this.indirectItem = null;
    this.duplicateAliasItems = null;
    this.duplicateAlias = null;
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

        const itemDetails = this.findRoomItems(tokens, verbEndIndex);

        if (itemDetails && itemDetails.length) {
          const { alias, itemsWithName } = itemDetails[0];

          const item = itemsWithName[0];
          this.roomItem = item || this.roomItem;

          if (item && item.visible && item.verbs[possibleVerb]) {
            this.actualVerb = item.verbs[possibleVerb];
            this.verbSupported = true;
            let indirectItemsWithName, indirectItem, indirectAlias;
            let validCombination = false;

            if (this.actualVerb.prepositional) {
              indirectAlias = itemDetails[1]?.alias;
              indirectItemsWithName = itemDetails[1]?.itemsWithName;

              if (indirectItemsWithName) {
                indirectItem = indirectItemsWithName[0];

                if (indirectItem && indirectItem.visible) {
                  this.indirectItem = indirectItem;
                  validCombination = true;
                }
              }
            } else {
              validCombination = true;
            }

            if (validCombination) {
              if (itemsWithName.length > 1) {
                // Primary item name is a duplicate
                this.recordDuplicates(itemsWithName, alias);
                continue;
              } else if (indirectItemsWithName?.length > 1) {
                // Secondary item name is a duplicate
                this.recordDuplicates(indirectItemsWithName, indirectAlias);
                continue;
              }

              return item.try(possibleVerb, indirectItem);
            }
          }
        }
      }
    }

    return this.giveFeedback();
  }

  recordDuplicates(itemsWithName, name) {
    if (!this.duplicateAlias) {
      this.duplicateAliasItems = itemsWithName;
      this.duplicateAlias = name;
    }
  }

  findRoomItems(tokens, verbEndIndex) {
    const room = selectRoom();
    const itemDetails = [];
    const usedIndices = []; // Keep track of token indices we've found items at

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
        if (usedIndices.includes(itemIndex)) {
          // Don't try indices we've already found items at
          continue;
        }

        const endIndex = itemIndex + numItemWords;
        const possibleItemWords = tokens.slice(itemIndex, endIndex);
        const possibleItem = possibleItemWords.join(" ");

        if (!itemDetails.length) {
          // Is the first item registered globally?
          const itemExists = selectItemNames().has(possibleItem);
          this.registeredItem = itemExists ? possibleItem : this.registeredItem;
        }

        // Is the item in the room and visible? Does it support the verb?
        let itemsWithName =
          room.accessibleItems[possibleItem]?.filter(item => item.visible) ||
          [];

        // Try items in the player's inventory as well
        const inventoryItems = selectInventory().items[possibleItem];

        if (inventoryItems) {
          itemsWithName = [...itemsWithName, ...inventoryItems];
        }

        if (itemsWithName?.length) {
          this.recordItems(
            possibleItem,
            itemsWithName,
            itemDetails,
            itemIndex,
            numItemWords,
            usedIndices
          );
        }

        if (itemDetails.length > 1) {
          return itemDetails;
        }
      }
    }

    return itemDetails;
  }

  recordItems(
    alias,
    itemsWithName,
    itemDetails,
    itemIndex,
    numItemWords,
    usedIndices
  ) {
    // Record indices of this item so we don't try to find other items there
    for (let i = itemIndex; i < itemIndex + numItemWords; i++) {
      usedIndices.push(i);
    }

    if (itemDetails.length) {
      if (itemIndex < itemDetails[0].itemIndex) {
        // console.log("SHIFTING" + itemsWithName[0].name);
        return itemDetails.unshift({ alias, itemsWithName, itemIndex });
      }
    }

    return itemDetails.push({ alias, itemsWithName, itemIndex });
  }

  giveFeedback() {
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
    const options = this.duplicateAliasItems.reduce(
      (acc, item, i) => ({
        ...acc,
        [item.name]: {
          id: `option_${i}`,
          actions: () => item.try(this.actualVerb.name, this.indirectItem)
        }
      }),
      {}
    );

    options["Cancel"] = {
      id: "cancel"
    };

    const optionGraph = new OptionGraph({
      id: "disambiguation",
      actions: `Which ${this.duplicateAlias} do you mean?`,
      options
    });

    // TODO Bug in ActionChain that means options are rendered even though OptionChain.renderOptions is false
    return optionGraph.commence().chain();
  }
}
