import { getStore } from "../../redux/storeRegistry";
import { changeInteraction } from "../../redux/gameActions";
import { Append } from "../interactions/interaction";
import {
  selectVerbNames,
  selectRoom,
  selectItemNames,
  selectInventory,
  selectKeywords,
  selectStartingRoom,
  selectDebugMode,
  selectGame
} from "../../utils/selectors";
import { toTitleCase } from "../../utils/textFunctions";
import disambiguate from "../../utils/disambiguation";
import { AnyAction } from "redux";

interface DecisionTree {
  input: string;
  room: RoomT;
  tokens: string[];
  verbConstructions: {
    verbs: {
      [verbConstruction: string]: VerbConstruction;
    };
    notVerbs: {
      [verbConstruction: string]: VerbConstruction;
    };
  };
  registeredVerbs: string[];
  registeredItem?: string;
  registeredVerb?: string;
  actualVerb?: VerbT;
  verbSupported: boolean;
  roomItem?: ItemT;
  indirectItem?: ItemT;
  duplicateAliasItems?: ItemT[];
  duplicateAlias?: string;
  duplicateItemIsPrimary: boolean;
  tooManyDuplicates: boolean;
}

interface VerbConstruction {
  numWords: number;
  verbIndex: number;
  possibleVerb: string;
  canonicalVerb?: string;
  endIndex?: number;
  keyword?: VerbT;
  roomVerb?: VerbT;
  itemDetails: ItemDetails[];
  roomItem?: ItemT;
  actualVerb?: VerbT;
  indirectItem?: ItemT;
  validCombination: boolean;
  itemConstructions: {
    [itemConstruction: string]: ItemConstruction;
  };
}

interface ItemConstruction {
  numWords: number;
  itemIndex: number;
  endIndex: number;
  possibleItem: string;
  itemExists?: boolean;
  itemsWithName: ItemT[];
}

export class Parser {
  decisionTree: DecisionTree;

  constructor(input: string) {
    this.decisionTree = {
      input,
      room: selectStartingRoom(),
      tokens: [],
      verbConstructions: {
        verbs: {},
        notVerbs: {},
      },
      registeredVerbs: [],
      registeredItem: undefined,
      registeredVerb: undefined,
      actualVerb: undefined,
      verbSupported: false,
      roomItem: undefined,
      indirectItem: undefined,
      duplicateAliasItems: undefined,
      duplicateAlias: undefined,
      duplicateItemIsPrimary: true,
      tooManyDuplicates: false,
    };
  }

  get dt() {
    return this.decisionTree;
  }

  get input() {
    return this.decisionTree.input;
  }

  get tokens() {
    return this.decisionTree.tokens;
  }

  get room() {
    return this.decisionTree.room;
  }

  parse() {
    try {
      return this.parseTokens();
    } finally {
      if (selectDebugMode()) {
        console.log("Parser decision tree", this.decisionTree);
      }
    }
  }

  parseTokens() {
    this.decisionTree.tokens = this.input.trim().toLowerCase().split(/\s+/);

    if (this.tokens[0] === "debug") {
      // Need case-sensitive args for the debug command.
      const args = this.input.trim().split(/\s+/).slice(1);
      return selectKeywords().debug.attempt(args[0], args.slice(1));
    }

    this.decisionTree.room = selectRoom();

    for (let numWords = this.tokens.length; numWords > 0; numWords--) {
      for (let verbIndex = 0; verbIndex <= this.tokens.length - numWords; verbIndex++) {
        const attemptResult = this.constructVerb(numWords, verbIndex);

        if (attemptResult) {
          // If there's any kind of result, return it.
          return attemptResult;
        }
      }
    }

    return this.giveFeedback();
  }

  constructVerb(numWords: number, verbIndex: number) {
    const vc: VerbConstruction = {
      numWords,
      verbIndex,
      possibleVerb: "",
      itemDetails: [],
      itemConstructions: {},
      validCombination: false,
    };
    const possibleVerbWords = this.tokens.slice(verbIndex, verbIndex + numWords);
    vc.possibleVerb = possibleVerbWords.join(" ");

    // Is the verb registered globally?
    vc.canonicalVerb = selectVerbNames()[vc.possibleVerb];

    // If there's a verb with this alias, register it.
    if (vc.canonicalVerb) {
      this.dt.registeredVerb = vc.possibleVerb;
    }

    vc.endIndex = verbIndex + numWords;

    if (vc.canonicalVerb) {
      this.decisionTree.verbConstructions.verbs[vc.possibleVerb] = vc;
      this.decisionTree.registeredVerbs.push(vc.possibleVerb);
    } else {
      this.decisionTree.verbConstructions.notVerbs[vc.possibleVerb] = vc;
    }

    // Is the verb a keyword?
    vc.keyword = selectKeywords()[vc.possibleVerb];

    // If the player hasn't included an item (or a matching keyword expects extra args), try keywords and the current room
    if (vc.endIndex === this.tokens.length || vc.keyword?.expectsArgs) {
      if (vc.keyword) {
        // Invoke keyword action, passing extra args for benefit of those that expect them.
        return vc.keyword.attempt(...this.tokens.slice(vc.endIndex));
      }

      // Is the verb in the current room?
      vc.roomVerb = this.room.verbs[vc.possibleVerb];

      if (vc.roomVerb) {
        // The room has the verb, so do it
        return vc.roomVerb.attempt(this.room);
      }
    }

    vc.itemDetails = this.findRoomItems(vc, this.tokens, vc.endIndex);

    if (vc.itemDetails.length) {
      const { alias, itemsWithName } = vc.itemDetails[0];

      let validItemsWithName = itemsWithName.filter((item: ItemT) => item?.visible && item.verbs[vc.possibleVerb!]);
      const itemsWithPrecedence = validItemsWithName.filter((item) => item.hasParserPrecedence);

      // If one and only one item takes precedence, use that one.
      if (itemsWithPrecedence.length === 1) {
        validItemsWithName = [itemsWithPrecedence[0]];
      }

      if (!validItemsWithName.length) {
        this.dt.roomItem = itemsWithName[0] || this.dt.roomItem; // Record a room item for feedback purposes.
      }

      for (let itemIndex in validItemsWithName) {
        const item = validItemsWithName[itemIndex];
        vc.roomItem = item;
        this.dt.roomItem = item || this.dt.roomItem; // Record a valid room item.

        vc.actualVerb = item.verbs[vc.possibleVerb];
        this.dt.actualVerb = item.verbs[vc.possibleVerb];
        this.dt.verbSupported = true;
        let indirectItemsWithName, indirectItem, indirectAlias;
        vc.validCombination = true;

        // Do we have a valid indirect item?
        indirectAlias = vc.itemDetails[1]?.alias;
        indirectItemsWithName = vc.itemDetails[1]?.itemsWithName;

        if (indirectItemsWithName) {
          indirectItem = indirectItemsWithName[0];

          if (indirectItem && indirectItem.visible) {
            vc.indirectItem = indirectItem;
            this.dt.indirectItem = indirectItem;
          }
        }

        if (this.dt.actualVerb.prepositional && !this.dt.actualVerb.prepositionOptional && !this.dt.indirectItem) {
          vc.validCombination = false;
        }

        if (vc.validCombination) {
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
          return item.try(vc.possibleVerb, this.dt.indirectItem);
        }
      }
    }
  }

  recordDuplicates(itemsWithName: ItemT[], name: string, isPrimary: boolean) {
    if (!this.dt.duplicateAlias) {
      this.dt.duplicateAliasItems = itemsWithName;
      this.dt.duplicateAlias = name;
      this.dt.duplicateItemIsPrimary = isPrimary;
    } else {
      this.dt.tooManyDuplicates = true;
    }
  }

  findRoomItems(verbConstruction: VerbConstruction, tokens: string[], verbEndIndex: number) {
    const room = selectRoom();
    const itemDetails: ItemDetails[] = [];
    const usedIndices: number[] = []; // Keep track of token indices we've found items at

    for (let numItemWords = tokens.length - verbEndIndex; numItemWords > 0; numItemWords--) {
      for (let itemIndex = verbEndIndex; itemIndex <= tokens.length - numItemWords; itemIndex++) {
        if (usedIndices.includes(itemIndex)) {
          // Don't try indices we've already found items at
          continue;
        }

        const endIndex = itemIndex + numItemWords;
        const possibleItemWords = tokens.slice(itemIndex, endIndex);
        const possibleItem = possibleItemWords.join(" ");

        const ic: ItemConstruction = {
          numWords: numItemWords,
          itemIndex,
          endIndex,
          possibleItem,
          itemsWithName: [],
        };
        verbConstruction.itemConstructions[possibleItem] = ic;

        if (!itemDetails.length) {
          // Is the item registered globally?
          ic.itemExists = selectItemNames().has(possibleItem);

          if (ic.itemExists && (!this.dt.registeredItem || possibleItem.length > this.dt.registeredItem.length)) {
            this.dt.registeredItem = possibleItem;
          }
        }

        // Is the item in the room and visible? Does it support the verb?
        ic.itemsWithName = room.accessibleItems[possibleItem]?.filter((item) => item.visible) || [];

        // Try items in the player's inventory as well
        const inventoryItems = selectInventory().accessibleItems[possibleItem]?.filter((item) => item.visible);

        if (inventoryItems) {
          ic.itemsWithName = [...ic.itemsWithName, ...inventoryItems];
        }

        if (ic.itemsWithName?.length) {
          this.recordItems(ic, possibleItem, itemDetails, usedIndices);
        }

        // Once we have two items, stop looking. Should we keep looking, in case of false positives?
        if (itemDetails.length > 1) {
          return itemDetails;
        }
      }
    }

    return itemDetails;
  }

  recordItems(ic: ItemConstruction, alias: string, itemDetails: ItemDetails[], usedIndices: number[]) {
    // Record indices of this item so we don't try to find other items there
    for (let i = ic.itemIndex; i < ic.itemIndex + ic.numWords; i++) {
      usedIndices.push(i);
    }

    if (itemDetails.length) {
      if (ic.itemIndex < itemDetails[0].itemIndex) {
        return itemDetails.unshift({ alias, itemsWithName: ic.itemsWithName, itemIndex: ic.itemIndex });
      }
    }

    return itemDetails.push({ alias, itemsWithName: ic.itemsWithName, itemIndex: ic.itemIndex });
  }

  // Handles special cases where we want to use the canonical verb name, rather than an alias.
  getReportedVerb(registeredVerb: string) {
    if (registeredVerb === "x" || registeredVerb === "ex" || registeredVerb === "look") {
      return "examine";
    }

    return registeredVerb;
  }

  async giveFeedback() {
    let message;

    if (this.dt.registeredVerb) {
      const reportedVerb = this.getReportedVerb(this.dt.registeredVerb);

      if (this.dt.roomItem) {
        if (!this.dt.actualVerb) {
          this.findActualVerb();
        }

        if (this.dt.duplicateAliasItems) {
          // Player must be more specific
          return this.handleDuplicateAliases();
        } else if (this.dt.verbSupported) {
          // Prepositional verb missing a second item
          message = `${toTitleCase(reportedVerb)} the ${this.dt.registeredItem} ${this.dt.actualVerb!.interrogative}?`;
        } else if (this.dt.actualVerb && this.dt.actualVerb.prepositional) {
          // Prepositional verb with missing (or unsupported) first item
          message = `You can't ${reportedVerb} that ${this.dt.roomItem.preposition} the ${
            this.dt.registeredItem
          }${this.addPlayerName()}. Did you mean something else?`;
        } else {
          // The item's in the room but doesn't support the verb
          message = `You can't ${reportedVerb} the ${
            this.dt.registeredItem
          }${this.addPlayerName()}. It wouldn't achieve much.`;
        }
      } else if (this.dt.registeredItem) {
        // The item exists elsewhere
        message = `The ${this.dt.registeredItem} isn't here, so you can't ${reportedVerb} it. I'm sure you've seen it somewhere though.`;
      } else {
        // The item doesn't (yet) exist anywhere
        message = `You can't ${reportedVerb} that${this.addPlayerName()}. Did you mean something else?`;
      }
    } else {
      if (this.dt.roomItem) {
        // The item's in the room but the verb doesn't exist
        message = `You can't do that to the ${this.dt.registeredItem}${this.addPlayerName()}.`;
      } else if (this.dt.registeredItem) {
        // The item's elsewhere and the verb doesn't exist
        message = `The ${
          this.dt.registeredItem
        } isn't here${this.addPlayerName()}, and you can't do that to it anyway.`;
      } else {
        // Neither the verb nor the item exists
        message = `That's not something you can do${this.addPlayerName()}.`;
      }
    }

    // Display the message.
    await getStore().dispatch(changeInteraction(new Append(message)) as AnyAction);

    // Indicate the action failure.
    return false;
  }

  addPlayerName() {
    const { referToPlayerAs } = selectGame().config;
    return referToPlayerAs ? ", " + referToPlayerAs : "";
  }

  /*
   * Used to give feedback when the items the player has referred to don't support the verb.
   * Instead, find a matching verb on items in the room or in the player's inventory.
   */
  findActualVerb() {
    this.dt.actualVerb =
      this.findActualVerbIn(selectRoom().accessibleItems) || this.findActualVerbIn(selectInventory().items);
  }

  findActualVerbIn(itemMap: ItemItemsDict) {
    const itemArrays = Object.values(itemMap);

    // Use normal for loop so we can return from inside it
    for (let items of itemArrays) {
      const itemWithVerb = items.find((item) => item.verbs[this.dt.registeredVerb!]);

      if (itemWithVerb) {
        return itemWithVerb.verbs[this.dt.registeredVerb!];
      }
    }
  }

  handleDuplicateAliases() {
    if (this.dt.tooManyDuplicates) {
      // We're not even going to try to handle this situation. Too complicated.
      return getStore().dispatch(
        changeInteraction(new Append(`You need to be more specific${this.addPlayerName()}.`)) as AnyAction
      );
    }

    const onChoose = (item: ItemT) => {
      if (this.dt.duplicateItemIsPrimary) {
        return item.try(this.dt.actualVerb!.name, this.dt.indirectItem);
      } else {
        return this.dt.roomItem!.try(this.dt.actualVerb!.name, item);
      }
    };

    return disambiguate(this.dt.duplicateAlias!, this.dt.duplicateAliasItems!, onChoose);
  }
}
