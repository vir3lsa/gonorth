import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { initStore } from "./redux/store";
import { createKeywords } from "./game/keywords";
import IODevice from "./web/iodevice";
import { getStore } from "./redux/storeRegistry";
import {
  newGame,
  changeInteraction,
  addEvent as eventAdded,
  setInventorySize
} from "./redux/gameActions";
import { Interaction } from "./game/interaction";
import Option from "./game/option";
import Room from "./game/room";
import { ActionChain } from "./utils/actionChain";
import { PagedText } from "./game/text";
import { goToRoom } from "./utils/lifecycle";

initStore();

const game = {};

function initGame(title, author, debugMode) {
  game.title = title;
  game.author = author;
  game.debugMode = debugMode;
  game.container = null;
  game.author = null;
  game.introActions = new ActionChain(() => goToStartingRoom());
  game.schedules = [];
  game._startingRoom = new Room(
    "Empty Room",
    "The room is completely devoid of anything interesting."
  );

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
  if (
    typeof intro === "string" ||
    (Array.isArray(intro) && typeof intro[0] === "string")
  ) {
    game.introActions = new ActionChain(new PagedText(intro), () =>
      goToStartingRoom()
    );
  } else {
    throw Error("Intro must be a string or a string array.");
  }
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
  getStore().dispatch(setInventorySize(size));
}

export { default as Room } from "./game/room";
export { Verb, GoVerb } from "./game/verb";
export { default as Door } from "./game/door";
export { default as Item } from "./game/item";
export { Interaction, Append } from "./game/interaction";
export { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./game/event";
export { default as Option } from "./game/option";
export { CyclicText, SequentialText, RandomText, PagedText } from "./game/text";
export { Schedule } from "./game/schedule";
export { Route } from "./game/route";
export { Npc } from "./game/npc";
export { goToRoom } from "./utils/lifecycle";
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
  setInventoryCapacity
};
