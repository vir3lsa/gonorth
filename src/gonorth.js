import React from "react";
import { createRoot } from "react-dom/client";

import { initStore } from "./redux/store";
import { getStore, unregisterStore } from "./redux/storeRegistry";
import { addEvent as eventAdded, newGame, setStartRoom } from "./redux/gameActions";
import { Room } from "./game/items/room";
import { ActionChain } from "./utils/actionChain";
import { clearPage, createPlayer, goToRoom, initAutoActions } from "./utils/lifecycle";
import { getHelpGraph, getHintGraph } from "./utils/defaultHelp";
import { GoNorth } from "./web/GoNorth";
import {
  selectRoom,
  selectPlayer,
  selectStartingRoom,
  selectEffects,
  selectInventoryItems,
  selectItem
} from "./utils/selectors";
import { createKeywords } from "./game/verbs/keywords";
import seedrandom from "seedrandom";

const game = {};

function initGame(title, author, config, initialiser) {
  unregisterStore();
  initStore(config?.storeName);
  createPlayer();
  game.title = title;
  game.author = author;
  game.config = config;
  game.container = null;
  game.introActions = new ActionChain(() => goToStartingRoom());
  game.schedules = [];
  game.help = getHelpGraph();
  game.hintGraph = getHintGraph();
  game.hintNode = "default";
  game.initialiser = initialiser;

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

function attach(container) {
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

/**
 * @param {{ pages: string[]; }} intro
 */
function setIntro(intro) {
  game.introActions = new ActionChain(
    () => clearPage(),
    intro,
    () => clearPage(),
    () => getHelp(),
    () => goToStartingRoom()
  );
}

function goToStartingRoom() {
  return goToRoom(selectStartingRoom());
}

/**
 * @param {Room} room
 */
function setStartingRoom(room) {
  getStore().dispatch(setStartRoom(room));
}

function getRoom() {
  return selectRoom();
}

function addEvent(event) {
  getStore().dispatch(eventAdded(event));
}

function addSchedule(schedule) {
  game.schedules.push(schedule);
}

function setInventoryCapacity(size) {
  selectPlayer().capacity = size;
  const getTotalCarrying = () => selectInventoryItems().reduce((total, item) => total + item.size, 0);
  selectPlayer().free = size - getTotalCarrying();
}

function getHelp() {
  return game.help;
}

function setHelp(help) {
  game.help = help;
}

function giveHint() {
  return game.hintGraph.commence(game.hintNode);
}

function addHintNodes(...nodes) {
  game.hintGraph.addNodes(...nodes);
}

function setHintNodeId(nodeId) {
  game.hintNode = nodeId;
}

function addEffect(primaryItem, secondaryItem, verbName, successful, ...effects) {
  if (typeof verbName !== "string") {
    throw Error("Tried to add an effect without specifying a verb name.");
  }

  selectEffects().add(primaryItem, secondaryItem, verbName, successful, false, ...effects);
}

function addWildcardEffect(secondaryItem, verbName, successful, ...effects) {
  if (typeof verbName !== "string") {
    throw Error("Tried to add a wildcard effect without specifying a verb name.");
  }

  selectEffects().addWildcard(secondaryItem, verbName, successful, false, ...effects);
}

function addPreVerbEffect(primaryItem, secondaryItem, verbName, successful, ...effects) {
  if (typeof verbName !== "string") {
    throw Error("Tried to add an effect without specifying a verb name.");
  }

  selectEffects().add(primaryItem, secondaryItem, verbName, successful, true, ...effects);
}

function addPreVerbWildcardEffect(secondaryItem, verbName, successful, ...effects) {
  if (typeof verbName !== "string") {
    throw Error("Tried to add a wildcard effect without specifying a verb name.");
  }

  selectEffects().addWildcard(secondaryItem, verbName, successful, true, ...effects);
}

/**
 * Get an item from the store with the provided name or alias.
 * @param {string} name The name or alias of the item
 * @param {*} index (Optional) The index of the item if there are multiple items with the provided alias. Defaults to 0.
 * @returns A item with the given alias, or undefined.
 */
function getItem(name, index = 0) {
  const itemSet = selectItem(name.toLowerCase());

  if (itemSet?.size) {
    const items = [...itemSet];
    return items[index];
  }
}

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
export { OptionGraph, next, previous } from "./game/interactions/optionGraph";
export {
  selectEffects,
  selectInventory,
  selectInventoryItems,
  selectOptionGraph,
  selectRoom,
  selectTurn,
  selectPlayer
} from "./utils/selectors";
export { ActionChain, Action } from "./utils/actionChain";
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
  addWildcardEffect,
  addPreVerbEffect,
  addPreVerbWildcardEffect
};
