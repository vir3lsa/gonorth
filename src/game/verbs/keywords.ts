import { Verb, newVerb } from "./verb";
import { selectInventory, selectKeywords } from "../../utils/selectors";
import { RandomText } from "../interactions/text";
import { OptionGraph } from "../interactions/optionGraph";
import { getHelp, giveHint } from "../../gonorth";
import { getKeywordsTable } from "../../utils/defaultHelp";
import { getStore } from "../../redux/storeRegistry";
import { addKeywords, removeKeywords } from "../../redux/gameActions";
import { handleDebugOperations } from "../../utils/debugFunctions";
import { clearPage } from "../../utils/lifecycle";

export function createKeywords() {
  const emptyInventoryText = new RandomText(
    "You're not holding anything.",
    "You're not carrying anything.",
    "You've got nothing except your determination.",
    "Your hands are empty."
  );

  const inventoryVerb = new Verb(
    "inventory",
    true,
    () => {
      const inventory = selectInventory();

      if (!inventory.itemArray.filter((item) => !item.doNotList).length) {
        return emptyInventoryText;
      }

      return `You're carrying ${inventory.basicItemList}.`;
    },
    null,
    ["i", "holding", "carrying"],
    true,
    "Inspect the items you're carrying."
  );

  const waitText = new RandomText(
    "You pause for a moment, taking stock of the situation.",
    "You look around you and drink in your surroundings, letting the moment linger.",
    "You stop and think. Yes, you're sure there's a way out of this mess.",
    "You wonder aloud whether you'll make it home alive. No-one answers.",
    "How did you get yourself into this pickle? And how to clamber out?"
  );

  const stopWaitingText = new RandomText(
    "You snap out of your reverie and return your attention to the room.",
    "You've waited long enough. You get back to the task at hand.",
    "Satisfied everything's in order, you consider what to do next."
  );

  const waitNodes = [
    {
      id: "wait",
      actions: waitText,
      options: {
        "Keep waiting": "wait",
        "Stop waiting": "stop"
      }
    },
    {
      id: "stop",
      noEndTurn: true,
      actions: stopWaitingText
    }
  ];

  const waitGraph = new OptionGraph("wait", ...waitNodes);
  const wait = new Verb("wait", true, waitGraph.commence(), [], [], true, "Allow time to pass.");

  const help = new Verb(
    "help",
    true,
    getHelp(),
    null,
    ["assist", "h", "instructions", "instruct", "welcome"],
    true,
    "Display help pages."
  );

  const keywordsVerb = new Verb(
    "keywords",
    true,
    () => getKeywordsTable(),
    null,
    ["keyword", "key word", "key words"],
    true,
    "Display keywords list."
  );

  const hint = new Verb(
    "hint",
    true,
    () => giveHint(),
    null,
    ["hints", "clue", "clues"],
    true,
    "Get a hint on how to proceed."
  );

  const clear = new Verb(
    "clear",
    true,
    () => clearPage("###### `>` clear"),
    null,
    ["clr"],
    true,
    "Start a fresh page."
  );

  const debug = newVerb({
    name: "debug",
    onSuccess: ({ operation, args }) => handleDebugOperations(operation as string, ...(args as string[])),
    isKeyword: true,
    doNotList: true,
    expectsArgs: true,
    expectedArgs: ["operation", "args"]
  });

  addKeyword(inventoryVerb);
  addKeyword(wait);
  addKeyword(help);
  addKeyword(keywordsVerb);
  addKeyword(hint);
  addKeyword(clear);
  addKeyword(debug);
}

export function addKeyword(keyword: VerbT) {
  const keywordMap = keyword.aliases.reduce(
    (acc, alias) => {
      acc[alias] = keyword;
      return acc;
    },
    { [keyword.name]: keyword }
  );

  getStore().dispatch(addKeywords(keywordMap));
}

/**
 * @returns {Keywords}
 */
export function getKeywords() {
  return selectKeywords();
}

export function getKeyword(name: string) {
  return getKeywords()[name];
}

export function removeKeyword(keyword: string) {
  const verb = getKeyword(keyword);
  getStore().dispatch(removeKeywords(keyword));
}
