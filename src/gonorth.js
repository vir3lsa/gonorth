import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { initStore } from "./redux/store";
import { createKeywords } from "./game/verbs/keywords";
import IODevice from "./web/iodevice";
import { getStore } from "./redux/storeRegistry";
import {
  newGame,
  changeInteraction,
  addEvent as eventAdded
} from "./redux/gameActions";
import { Interaction } from "./game/interactions/interaction";
import { Option } from "./game/interactions/option";
import { Room } from "./game/items/room";
import { ActionChain } from "./utils/actionChain";
import { goToRoom } from "./utils/lifecycle";
import { Item } from "./game/items/item";
import { defaultHelp, hintGraph } from "./utils/defaultHelp";

initStore();

const game = {};

function initGame(title, author, debugMode) {
  game.title = title;
  game.author = author;
  game.debugMode = debugMode;
  game.container = null;
  game.introActions = new ActionChain(() => goToStartingRoom());
  game.schedules = [];
  game._startingRoom = new Room("Empty Room", "The room is completely devoid of anything interesting.");
  game.player = new Item("player", "You look as you normally do.", false);
  game.help = defaultHelp;
  game.hintGraph = hintGraph;
  game.hintNode = "default";

  createKeywords();

  const inBrowser = typeof window !== "undefined";
  getStore().dispatch(newGame(game, inBrowser, game.debugMode));

  return game;
}

function attach(container) {
  if (!container) {
    throw Error("No container provided");
  }

  game.container = container;
  renderTopLevel();
}

function play() {
  let output = `# ${game.title || "Untitled"}`;

  if (game.author) {
    output += `\n### By ${game.author}`;
  }

  const titleScreen = new Interaction(
    output,
    new Option("Play", () => {
      game.introActions.chain();
    })
  );

  getStore().dispatch(changeInteraction(titleScreen));
}

function renderTopLevel() {
  if (game.container) {
    game.component = (
      <Provider store={getStore()}>
        <IODevice />
      </Provider>
    );
    ReactDOM.render(game.component, game.container);
  }
}

/**
 * @param {{ pages: string[]; }} intro
 */
function setIntro(intro) {
  game.introActions = new ActionChain(
    intro,
    () => getHelp(),
    () => goToStartingRoom()
  );
}

function goToStartingRoom() {
  return goToRoom(game._startingRoom);
}

/**
 * @param {Room} room
 */
function setStartingRoom(room) {
  game._startingRoom = room;
}

function getRoom() {
  return game.room;
}

function addEvent(event) {
  getStore().dispatch(eventAdded(event));
}

function addSchedule(schedule) {
  game.schedules.push(schedule);
}

function setInventoryCapacity(size) {
  game.player.capacity = size;
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

export { Room } from "./game/items/room";
export { Verb, GoVerb, newVerb } from "./game/verbs/verb";
export { Door } from "./game/items/door";
export { Container } from "./game/items/container";
export { Item, newItem } from "./game/items/item";
export { Interaction, Append } from "./game/interactions/interaction";
export { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./game/events/event";
export { Option } from "./game/interactions/option";
export * from "./game/interactions/text";
export { Schedule } from "./game/events/schedule";
export { Route } from "./game/events/route";
export { Npc } from "./game/items/npc";
export { goToRoom } from "./utils/lifecycle";
export { OptionGraph, next, previous } from "./game/interactions/optionGraph";
export { selectInventory, selectRoom, selectTurn, selectPlayer } from "./utils/selectors";
export { Effects } from "./utils/effects";
export { ActionChain, Action } from "./utils/actionChain";
export { addKeyword, getKeyword, getKeywords, removeKeyword } from "./game/verbs/keywords";
export { inSameRoomAs, playerCanCarry, playerHasItem } from "./utils/sharedFunctions";
export * from "./utils/textFunctions";
export {
  initGame,
  attach,
  play,
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
  setHintNodeId
};
