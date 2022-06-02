import React from "react";
import ReactDOM from "react-dom";

import { initStore } from "./redux/store";
import { getStore, unregisterStore } from "./redux/storeRegistry";
import { addEvent as eventAdded, addValue, forgetValue, newGame, setStartRoom, updateValue } from "./redux/gameActions";
import { Room } from "./game/items/room";
import { ActionChain } from "./utils/actionChain";
import { clearPage, createPlayer, goToRoom } from "./utils/lifecycle";
import { getHelpGraph, getHintGraph } from "./utils/defaultHelp";
import { GoNorth } from "./web/GoNorth";
import { selectRoom, selectPlayer, selectStartingRoom, selectEffects, selectItem } from "./utils/selectors";
import { createKeywords } from "./game/verbs/keywords";

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

  getStore().dispatch(setStartRoom(new Room("Empty Room", "The room is completely devoid of anything interesting.")));

  // Set up the game's rooms and items etc.
  if (initialiser) {
    initialiser();
  }

  createKeywords();
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
    ReactDOM.render(game.component, game.container);
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

function store(propertyName, value) {
  getStore().dispatch(addValue(propertyName, value));
}

function update(propertyName, value) {
  getStore().dispatch(updateValue(propertyName, value));
}

function retrieve(propertyName) {
  return getStore().getState().customState[propertyName];
}

function forget(propertyName) {
  getStore().dispatch(forgetValue(propertyName));
}

function addEffect(primaryItem, secondaryItem, verbName, successful, ...effects) {
  if (typeof verbName !== "string") {
    throw Error("Tried to add an effect without specifying a verb name.");
  }

  selectEffects().add(primaryItem, secondaryItem, verbName, successful, ...effects);
}

function addWildcardEffect(secondaryItem, verbName, successful, ...effects) {
  if (typeof verbName !== "string") {
    throw Error("Tried to add a wildcard effect without specifying a verb name.");
  }

  selectEffects().addWildcard(secondaryItem, verbName, successful, ...effects);
}

function getItem(name) {
  const items = selectItem(name);
  const itemList = items ? [...items] : [];

  if (itemList.length > 1) {
    throw Error(
      `Tried to get an item called '${name}' but got several with the same alias. Use the item's unique name instead.`
    );
  } else if (!itemList.length) {
    return;
  }

  return itemList[0];
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
export { goToRoom, gameOver, play } from "./utils/lifecycle";
export { OptionGraph, next, previous } from "./game/interactions/optionGraph";
export { selectInventory, selectRoom, selectTurn, selectPlayer } from "./utils/selectors";
export { ActionChain, Action } from "./utils/actionChain";
export { addKeyword, getKeyword, getKeywords, removeKeyword } from "./game/verbs/keywords";
export { inSameRoomAs, playerCanCarry, playerHasItem } from "./utils/sharedFunctions";
export { moveItem } from "./utils/itemFunctions";
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
  setHelp,
  giveHint,
  addHintNodes,
  setHintNodeId,
  store,
  update,
  retrieve,
  forget,
  addEffect,
  addWildcardEffect,
  getItem
};
