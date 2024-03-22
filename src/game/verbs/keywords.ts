import { Verb, newVerb } from "./verb";
import { selectInventory, selectKeywords } from "../../utils/selectors";
import { RandomText } from "../interactions/text";
import { getHelp, giveHint } from "../../gonorth";
import { getKeywordsTable } from "../../utils/defaultHelp";
import { getStore } from "../../redux/storeRegistry";
import { addKeywords, removeKeywords, revealScene } from "../../redux/gameActions";
import { handleDebugOperations } from "../../utils/debugFunctions";
import { clearPage } from "../../utils/sharedFunctions";
import createWaitGraph from "./waitGraph";

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

  const waitGraph = createWaitGraph();
  const wait = new Verb("wait", true, () => waitGraph.commence(), [], [], true, "Allow time to pass.");

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

  const hideScene = new Verb.Builder("hide scene")
    .withDescription("Hide the scene image.")
    .withAliases("close scene", "hide image")
    .isKeyword()
    .withOnSuccess(() => {
      getStore().dispatch(revealScene(false));
    })
    .build();

  const showScene = new Verb.Builder("show scene")
    .withDescription("Reveal the scene image.")
    .withAliases("reveal scene", "open scene", "show image", "reveal image", "open image")
    .isKeyword()
    .withOnSuccess(() => {
      getStore().dispatch(revealScene(true));
    })
    .build();

  addKeyword(inventoryVerb);
  addKeyword(wait);
  addKeyword(help);
  addKeyword(keywordsVerb);
  addKeyword(hint);
  addKeyword(clear);
  addKeyword(debug);
  addKeyword(hideScene);
  addKeyword(showScene);
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
