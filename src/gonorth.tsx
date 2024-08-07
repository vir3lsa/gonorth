import React from "react";
import { createRoot } from "react-dom/client";
import { initStore } from "./redux/store";
import { getStore, unregisterStore } from "./redux/storeRegistry";
import { changeImage, addEvent as eventAdded, gameStarted, newGame, setStartRoom } from "./redux/gameActions";
import { Room } from "./game/items/room";
import { addKeyword, getKeyword, getKeywords, removeKeyword } from "./game/verbs/keywords";
import { newVerb } from "./game/verbs/verb";
import { ActionChain } from "./utils/actionChain";
import { createPlayer, goToRoom, initAutoActions, gameOver, theEnd, play, addAutoAction } from "./utils/lifecycle";
import { getHelpGraph, getHintGraph } from "./utils/defaultHelp";
import {
  selectRoom,
  selectPlayer,
  selectStartingRoom,
  selectEffects,
  selectInventoryItems,
  selectItem,
  selectInventory,
  selectOptionGraph,
  selectTurn
} from "./utils/selectors";
import { forget, retrieve, store, update } from "./utils/persistentVariableFunctions";
import { createKeywords } from "./game/verbs/keywords";
import { GoNorth } from "./web/GoNorth";
import seedrandom from "seedrandom";
import { clearPage, inRoom, inSameRoomAs, playerCanCarry, playerHasItem } from "./utils/sharedFunctions";
import { getBasicItemList, bulletPointList, toTitleCase, getArticle, englishList } from "./utils/textFunctions";
import { moveItem, getItem as getUniqueItem } from "./utils/itemFunctions";
import { newDoor } from "./game/items/door";
import { newContainer } from "./game/items/container";
import { newItem } from "./game/items/item";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./game/events/event";

const RESUME_HINTS = "RESUME_HINTS";
const HINT_NODE = "HINT_NODE";

let game: Game;

function initGame(title: string, author: string, config: Config, version?: string, initialiser?: Initialiser) {
  unregisterStore();
  initStore(config?.storeName);
  createPlayer();
  game = {
    title: title,
    author: author,
    config: config,
    introActions: new ActionChain(() => goToStartingRoom()),
    schedules: [],
    help: getHelpGraph(),
    hintGraph: getHintGraph(),
    initialiser,
    version
  };

  // Seed the RNG for testing purposes.
  seedrandom(config.randomSeed, { global: true });

  getStore().dispatch(setStartRoom(new Room("Empty Room", "The room is completely devoid of anything interesting.")));

  // Set up the game's rooms and items etc.
  if (initialiser) {
    initialiser();
  }

  createKeywords();
  initAutoActions();
  getStore().dispatch(newGame(game, game.config.debugMode));

  return game;
}

function attach(container: Element) {
  if (!container) {
    throw Error("No container provided");
  }

  game.container = container;
  renderTopLevel();
}

function renderTopLevel() {
  if (game.container) {
    game.component = <GoNorth />;
    const root = createRoot(game.container);
    root.render(game.component);
  }
}

function setIntro(intro: string | string[] | Intro) {
  game.introActions = new ActionChain(
    () => clearPage(),
    () => {
      getStore().dispatch(changeImage(undefined));
    },
    intro,
    () => clearPage(),
    () => getHelp(),
    () => {
      getStore().dispatch(gameStarted());
    },
    () => goToStartingRoom()
  );
}

function goToStartingRoom() {
  return goToRoom(selectStartingRoom());
}

function setStartingRoom(room: RoomT) {
  getStore().dispatch(setStartRoom(room));
}

function getRoom() {
  return selectRoom();
}

function addEvent(event: EventT) {
  getStore().dispatch(eventAdded(event));
}

function addSchedule(schedule: ScheduleT | RouteT) {
  game.schedules.push(schedule);
}

function setInventoryCapacity(size: number) {
  selectPlayer().capacity = size;
  const getTotalCarrying = () => selectInventoryItems().reduce((total, item) => total + item.size, 0);
  selectPlayer().free = size - getTotalCarrying();
}

function getHelp() {
  return game.help;
}

function setHelp(help: OptionGraphT) {
  game.help = help;
}

function giveHint() {
  if (retrieve(RESUME_HINTS)) {
    return game.hintGraph.resume();
  } else {
    const startNode = retrieve(HINT_NODE);
    store(RESUME_HINTS, true);
    return game.hintGraph.commence(startNode);
  }
}

function addHintNodes(...nodes: GraphNode[]) {
  game.hintGraph.addNodes(...nodes);
}

function setHintNodeId(nodeId: string) {
  forget(RESUME_HINTS);
  store(HINT_NODE, nodeId, true);
}

function addEffect(effect: EffectT | EffectBuilderT) {
  selectEffects().add(effect);
}

/**
 * Get an item from the store with the provided name or alias.
 * @param name The name or alias of the item
 * @param index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 * @returns A item with the given alias, or undefined.
 */
function getItem(name: string, index = 0) {
  const itemSet = selectItem(name.toLowerCase());

  if (itemSet?.size) {
    const items = [...itemSet];
    return items[index];
  }
}

const gonorth = {
  addAutoAction,
  addEvent,
  addEffect,
  addHintNodes,
  addKeyword,
  addSchedule,
  attach,
  bulletPointList,
  englishList,
  forget,
  gameOver,
  getArticle,
  getBasicItemList,
  getHelp,
  getItem,
  getKeyword,
  getKeywords,
  getRoom,
  getUniqueItem,
  giveHint,
  goToRoom,
  goToStartingRoom,
  initGame,
  inRoom,
  inSameRoomAs,
  moveItem,
  newContainer,
  newDoor,
  newItem,
  newVerb,
  play,
  playerCanCarry,
  playerHasItem,
  removeKeyword,
  retrieve,
  selectEffects,
  selectInventory,
  selectInventoryItems,
  selectOptionGraph,
  selectPlayer,
  selectRoom,
  selectTurn,
  setHelp,
  setHintNodeId,
  setIntro,
  setInventoryCapacity,
  setStartingRoom,
  store,
  theEnd,
  TIMEOUT_MILLIS,
  TIMEOUT_TURNS,
  toTitleCase,
  update,
};

export default gonorth;
export { Room } from "./game/items/room";
export { Verb, GoVerb, newVerb } from "./game/verbs/verb";
export { Door, newDoor, Key } from "./game/items/door";
export { Container, newContainer } from "./game/items/container";
export { Item, newItem } from "./game/items/item";
export { Interaction, Append } from "./game/interactions/interaction";
export { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./game/events/event";
export { Option } from "./game/interactions/option";
export * from "./game/interactions/text";
export { Schedule } from "./game/events/schedule";
export { Route } from "./game/events/route";
export { Npc } from "./game/items/npc";
export { goToRoom, gameOver, theEnd, play, addAutoAction } from "./utils/lifecycle";
export { OptionGraph, next, previous, okay } from "./game/interactions/optionGraph";
export {
  selectEffects,
  selectInventory,
  selectInventoryItems,
  selectOptionGraph,
  selectRoom,
  selectTurn,
  selectPlayer
} from "./utils/selectors";
export { ActionChain, ActionClass } from "./utils/actionChain";
export { addKeyword, getKeyword, getKeywords, removeKeyword } from "./game/verbs/keywords";
export { inSameRoomAs, playerCanCarry, playerHasItem } from "./utils/sharedFunctions";
export { moveItem } from "./utils/itemFunctions";
export { AutoAction } from "./game/input/autoAction";
export * from "./utils/persistentVariableFunctions";
export * from "./utils/textFunctions";
export * from "./utils/itemFunctions";
export {
  initGame,
  attach,
  setIntro,
  setStartingRoom,
  goToStartingRoom,
  getRoom,
  addEvent,
  addSchedule,
  setInventoryCapacity,
  getHelp,
  getItem,
  setHelp,
  giveHint,
  addHintNodes,
  setHintNodeId,
  addEffect,
};
