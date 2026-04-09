import { Verb, VerbBuilder as VerbBuilder } from "./verb";
import { selectInventory, selectKeywords, selectRoom } from "../../utils/selectors";
import { RandomText } from "../interactions/text";
import gn from "../../gonorth";
import { getKeywordsTable } from "../../utils/defaultHelp";
import { getStore } from "../../redux/storeRegistry";
import { addKeywords, removeKeywords, revealScene } from "../../redux/gameActions";
import { handleDebugOperations } from "../../utils/debugFunctions";
import { clearPage } from "../../utils/sharedFunctions";
import createWaitGraph from "./waitGraph";
import { checkpoint } from "../../utils/lifecycle";

export function createKeywords() {
  const emptyInventoryText = new RandomText(
    "You're not holding anything.",
    "You're not carrying anything.",
    "You've got nothing except your determination.",
    "Your hands are empty."
  );

  const inventoryVerb = new Verb.Builder("inventory")
    .onSuccess(() => {
      const inventory = selectInventory();

      if (!inventory.itemArray.filter((item) => !item.doNotList).length) {
        return emptyInventoryText;
      }

      return `You're carrying ${inventory.basicItemList}.`;
    })
    .withAliases("i", "holding", "carrying")
    .isKeyword()
    .withDescription("Inspect the items you're carrying.");

  const waitGraph = createWaitGraph();
  const wait = new Verb.Builder("wait")
    .onSuccess(() => waitGraph.commence())
    .isKeyword()
    .withDescription("Allow time to pass.");

  const help = new Verb.Builder("help")
    .onSuccess(gn.getHelp())
    .withAliases("assist", "h", "instructions", "instruct", "welcome")
    .isKeyword()
    .withDescription("Display help pages.");

  const keywordsVerb = new Verb.Builder("keywords")
    .onSuccess(() => getKeywordsTable())
    .withAliases("keyword", "key word", "key words")
    .isKeyword()
    .withDescription("Display keywords list.");

  const hint = new Verb.Builder("hint")
    .onSuccess(() => gn.giveHint())
    .withAliases("hints", "clue", "clues")
    .isKeyword()
    .withDescription("Get a hint on how to proceed.");

  const clear = new Verb.Builder("clear")
    .onSuccess(() => clearPage("###### `>` clear"))
    .withAliases("clr")
    .isKeyword()
    .withDescription("Start a fresh page.");

  const debug = new Verb.Builder("debug")
    .onSuccess(({ operation, args }) => handleDebugOperations(operation as string, ...(args as string[])))
    .isKeyword()
    .doNotList()
    .expectsArgs()
    .withExpectedArgs("operation", "args");

  const hideScene = new Verb.Builder("hide scene")
    .withDescription("Hide the scene image.")
    .withAliases("close scene", "hide image")
    .isKeyword()
    .onSuccess(() => {
      getStore().dispatch(revealScene(false));
    });

  const showScene = new Verb.Builder("show scene")
    .withDescription("Reveal the scene image.")
    .withAliases("reveal scene", "open scene", "show image", "reveal image", "open image")
    .isKeyword()
    .onSuccess(() => {
      getStore().dispatch(revealScene(true));
    });

  const save = new Verb.Builder("save")
    .withDescription("Save the game.")
    .withAliases("quicksave", "persist")
    .isKeyword()
    .onSuccess(() => {
      if (selectRoom().checkpoint) {
        checkpoint();
        return "Game saved."
      } else {
        return "Sorry, but you can't save the game right now!"
      }
    });

  addKeyword(inventoryVerb);
  addKeyword(wait);
  addKeyword(help);
  addKeyword(keywordsVerb);
  addKeyword(hint);
  addKeyword(clear);
  addKeyword(debug);
  addKeyword(hideScene);
  addKeyword(showScene);
  addKeyword(save);
}

export function addKeyword(keywordOrBuilder: VerbT | VerbBuilder) {
  const keyword = keywordOrBuilder instanceof VerbBuilder ? keywordOrBuilder.build() : keywordOrBuilder;
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
