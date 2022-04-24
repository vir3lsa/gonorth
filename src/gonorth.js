import React from "react";
import ReactDOM from "react-dom";

import { initStore } from "./redux/store";
import { getPersistor, getStore } from "./redux/storeRegistry";
import { addEvent as eventAdded, newGame } from "./redux/gameActions";
import { Room } from "./game/items/room";
import { ActionChain } from "./utils/actionChain";
import { clearPage, deleteSave, goToRoom, loadSave } from "./utils/lifecycle";
import { Item } from "./game/items/item";
import { getHelpGraph, getHintGraph } from "./utils/defaultHelp";
import { GoNorth } from "./web/GoNorth";
import { selectRoom, selectTurn } from "./utils/selectors";
import { OptionGraph } from "./game/interactions/optionGraph";
import { PagedText } from "./game/interactions/text";
import { createKeywords } from "./game/verbs/keywords";

initStore();

const game = {};

function initGame(title, author, config) {
  game.title = title;
  game.author = author;
  game.config = config;
  game.container = null;
  game.introActions = new ActionChain(() => goToStartingRoom());
  game.schedules = [];
  game._startingRoom = new Room("Empty Room", "The room is completely devoid of anything interesting.");
  game.player = new Item("player", "You look as you normally do.", false);
  game.help = getHelpGraph();
  game.hintGraph = getHintGraph();
  game.hintNode = "default";

  // Set the store name.
  getPersistor().name = config?.storeName;

  createKeywords();
  getStore().dispatch(newGame(game, game.config.debugMode));
  loadSave();

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
  let titlePage = `# ${game.title || "Untitled"}`;

  if (game.author) {
    titlePage += `\n### By ${game.author}`;
  }

  const titleScreenGraph = new OptionGraph(
    "titleScreen",
    {
      id: "root",
      actions: new PagedText(titlePage),
      options: {
        play: {
          condition: () => selectTurn() === 1,
          actions: () => game.introActions.chain(),
          exit: true
        },
        continue: {
          condition: () => selectTurn() > 1,
          actions: () => goToRoom(selectRoom()).chain(),
          exit: true
        },
        "New Game": {
          condition: () => selectTurn() > 1,
          node: "newGameWarning"
        }
      }
    },
    {
      id: "newGameWarning",
      actions: new PagedText(
        "This will delete the current save game file and start a new game.\n\nDo you want to continue?"
      ),
      options: {
        yes: {
          actions: () => {
            deleteSave();
            game.introActions.chain();
          },
          exit: true
        },
        cancel: "root"
      }
    }
  );

  return titleScreenGraph.commence().chain();
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
  return goToRoom(game._startingRoom);
}

/**
 * @param {Room} room
 */
function setStartingRoom(room) {
  game._startingRoom = room;
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
export { goToRoom } from "./utils/lifecycle";
export { OptionGraph, next, previous } from "./game/interactions/optionGraph";
export { selectInventory, selectRoom, selectTurn, selectPlayer } from "./utils/selectors";
export { Effects, FixedSubjectEffects } from "./utils/effects";
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
