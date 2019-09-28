import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { output, promptInput, showOptions } from "../utils/consoleIO";
import IODevice from "../web/iodevice";
import { store } from "../redux/store";
import { newGame, changeInteraction } from "../redux/gameActions";
import { LOADING, TITLE, INTRO, ROOM } from "./gameState";
import Interaction from "./interaction";
import Option from "./option";
import Room from "./room";
import { parsePlayerInput } from "./parser";

const state = store.getState();
const selectOutput = state => state.game.interaction.currentPage;
const selectOptions = state => state.game.interaction.options;
const selectInBrowser = state => state.game.inBrowser;
const selectPlayerInput = state => state.game.playerInput;

let currentOutput = selectOutput(state);
let currentOptions = selectOptions(state);
let currentInput = selectPlayerInput(state);

export default class Game {
  constructor(title, debugMode) {
    this.title = title;
    this.debugMode = debugMode;
    this.status = LOADING;
    this.container = null;
    this.author = null;
    this._intro = null;
    this._startingRoom = new Room(
      "Empty Room",
      "The room is completely devoid of anything interesting."
    );

    store.subscribe(() => this._subscribe());
  }

  _subscribe() {
    const state = store.getState();
    const inBrowser = selectInBrowser(state);
    let previousInput = currentInput;
    currentInput = selectPlayerInput(state);
    const inputChanged = currentInput !== previousInput;

    if (!inBrowser || this.debugMode) {
      let previousOutput = currentOutput;
      let previousOptions = currentOptions;

      currentOutput = selectOutput(state);
      currentOptions = selectOptions(state);

      if (currentOutput !== previousOutput) {
        output(currentOutput);
      }

      if (inputChanged) {
        output(`Received input: ${currentInput}`);
      }

      if (currentOptions && currentOptions !== previousOptions) {
        if (inBrowser) {
          showOptions(currentOptions);
        } else {
          promptInput(currentOptions);
        }
      }
    }

    if (inputChanged) {
      parsePlayerInput(currentInput);
    }
  }

  attach(container) {
    if (!container) {
      throw Error("No container provided");
    }

    this.container = container;
    this.renderTopLevel();
  }

  play() {
    const inBrowser = typeof window !== "undefined";
    store.dispatch(newGame(this, inBrowser));
    let output = `# ${this.title || "Untitled"}`;

    if (this.author) {
      output += `\n### By ${this.author}`;
    }

    const titleScreen = new Interaction(
      output,
      new Option("Play", () => {
        if (this._intro) {
          this.status = INTRO;
          store.dispatch(changeInteraction(this._intro));
        } else {
          this.goToStartingRoom();
        }
      })
    );

    this.status = TITLE;
    store.dispatch(changeInteraction(titleScreen));
  }

  renderTopLevel() {
    if (this.container) {
      this.component = (
        <Provider store={store}>
          <IODevice />
        </Provider>
      );
      ReactDOM.render(this.component, this.container);
    }
  }

  /**
   * @param {{ pages: string[]; }} intro
   */
  set intro(intro) {
    const leaveIntroOption = new Option("Next", () => this.goToStartingRoom());
    this._intro = new Interaction(intro, leaveIntroOption);
  }

  goToStartingRoom() {
    this._room = this._startingRoom;
    store.dispatch(changeInteraction(this._room.interaction));
  }

  /**
   * @param {Room} room
   */
  set startingRoom(room) {
    this._startingRoom = room;
  }

  /**
   * Navigate directly to a new room without showing a message.
   * @param {Room} room
   */
  set room(room) {
    this._room = room;
    store.dispatch(changeInteraction(room.interaction));
  }

  /**
   * Navigate to a new room, showing a message.
   * @param {Room} room
   */
  goToRoom(room, message) {
    this._room = room;
    store.dispatch(
      changeInteraction(
        new Interaction(
          message,
          new Option("Next", () =>
            store.dispatch(changeInteraction(room.interaction))
          )
        )
      )
    );
  }

  get room() {
    return this._room;
  }
}
