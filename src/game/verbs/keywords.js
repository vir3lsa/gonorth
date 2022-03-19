import { Verb, GoVerb, newVerb } from "./verb";
import { selectInventory } from "../../utils/selectors";
import { RandomText } from "../interactions/text";
import { OptionGraph } from "../interactions/optionGraph";
import { getHelp, giveHint } from "../../gonorth";
import { getKeywordsTable } from "../../utils/defaultHelp";
import { getStore } from "../../redux/storeRegistry";
import { addKeywords, removeKeywords } from "../../redux/gameActions";
import { handleDebugOperations } from "../../utils/debugFunctions";

export const directionAliases = {
  north: ["n", "forward", "straight on"],
  south: ["s", "back", "backward", "backwards", "reverse"],
  east: ["e", "right"],
  west: ["w", "left"],
  up: ["u", "upward", "upwards"],
  down: ["d", "downward", "downwards"]
};

export function createKeywords() {
  const inventoryVerb = new Verb(
    "inventory",
    true,
    () => {
      const inventory = selectInventory();

      if (!inventory.itemArray.filter((item) => !item.doNotList).length) {
        return "You're not holding anything.";
      }

      return `You're carrying ${inventory.basicItemList}.`;
    },
    null,
    ["i", "holding", "carrying"],
    true,
    "Inspect the items you're carrying."
  );

  const north = new GoVerb("North", directionAliases["north"], true);
  const south = new GoVerb("South", directionAliases["south"], true);
  const east = new GoVerb("East", directionAliases["east"], true);
  const west = new GoVerb("West", directionAliases["west"], true);
  const up = new GoVerb("Up", directionAliases["up"], true);
  const down = new GoVerb("Down", directionAliases["down"], true);

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

  const debug = newVerb({
    name: "debug",
    onSuccess: (helpers, operation, ...args) => handleDebugOperations(operation, ...args),
    isKeyword: true,
    doNotList: true,
    expectsArgs: true
  });

  addKeyword(inventoryVerb);
  addKeyword(north);
  addKeyword(south);
  addKeyword(east);
  addKeyword(west);
  addKeyword(up);
  addKeyword(down);
  addKeyword(wait);
  addKeyword(help);
  addKeyword(keywordsVerb);
  addKeyword(hint);
  addKeyword(debug);
}

export function addKeyword(keyword) {
  const keywordMap = keyword.aliases.reduce(
    (acc, alias) => {
      acc[alias] = keyword;
      return acc;
    },
    { [keyword.name]: keyword }
  );

  getStore().dispatch(addKeywords(keywordMap));
}

export function getKeywords() {
  return getStore().getState().game.keywords;
}

export function getKeyword(name) {
  return getKeywords()[name];
}

export function removeKeyword(keyword) {
  const verb = getKeyword(keyword);
  getStore().dispatch(removeKeywords(keyword));
}
