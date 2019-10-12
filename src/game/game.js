import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import IODevice from "../web/iodevice";
import { getStore } from "../redux/storeRegistry";
import { newGame, changeInteraction, nextTurn } from "../redux/gameActions";
import { LOADING, TITLE, INTRO, ROOM } from "./gameState";
import { Interaction } from "./interaction";
import Option from "./option";
import Room from "./room";
import { DORMANT, PENDING, ACTIVE } from "./event";

export default class Game {
  constructor(title, debugMode) {
    this.title = title;
    this.debugMode = debugMode;
    this.status = LOADING;
    this.container = null;
    this.author = null;
    this._intro = null;
    this.events = [];
    this._startingRoom = new Room(
      "Empty Room",
      "The room is completely devoid of anything interesting."
    );
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
    getStore().dispatch(newGame(this, inBrowser, this.debugMode));
    let output = `# ${this.title || "Untitled"}`;

    if (this.author) {
      output += `\n### By ${this.author}`;
    }

    const titleScreen = new Interaction(
      output,
      new Option("Play", () => {
        if (this._intro) {
          this.status = INTRO;
          getStore().dispatch(changeInteraction(this._intro));
        } else {
          this.goToStartingRoom();
        }
      })
    );

    this.status = TITLE;
    getStore().dispatch(changeInteraction(titleScreen));
  }

  handleTurnEnd() {
    this.events.forEach(event => {
      if (event.state === DORMANT && event.condition()) {
        // First look for events to commence
        event.commence();
      } else if (event.state === PENDING) {
        // Then look for events that are counting down
        event.tick();
      } else if (event.state === ACTIVE) {
        // Then trigger active events
        event.trigger();
      }
    });

    // End the turn
    getStore().dispatch(nextTurn());
  }

  renderTopLevel() {
    if (this.container) {
      this.component = (
        <Provider store={getStore()}>
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
    getStore().dispatch(changeInteraction(this._room.interaction));
    this._room.revealItems();
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
    getStore().dispatch(changeInteraction(room.interaction));
    room.revealItems();
  }

  get room() {
    return this._room;
  }

  addEvent(event) {
    this.events.push(event);
  }
}
