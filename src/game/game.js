import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import IODevice from "../web/iodevice";
import { getStore } from "../redux/storeRegistry";
import { newGame, changeInteraction, nextTurn } from "../redux/gameActions";
import { Interaction } from "./interaction";
import Option from "./option";
import Room from "./room";
import { DORMANT, PENDING, ACTIVE } from "./event";
import { createChainableFunction, chainActions } from "../utils/actionChain";
import { SequentialText } from "./text";

export default class Game {
  constructor(title, debugMode) {
    this.title = title;
    this.debugMode = debugMode;
    this.container = null;
    this.author = null;
    this.introActions = createChainableFunction(() => this.goToStartingRoom());
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
        chainActions(this.introActions);
      })
    );

    getStore().dispatch(changeInteraction(titleScreen));
  }

  async handleTurnEnd() {
    for (let i in this.events) {
      const event = this.events[i];

      if (event.state === DORMANT && event.condition()) {
        // First look for events to commence
        await event.commence();
      } else if (event.state === PENDING) {
        // Then look for events that are counting down
        await event.tick();
      } else if (event.state === ACTIVE) {
        // Then trigger active events
        await event.trigger();
      }
    }

    // End the turn
    return getStore().dispatch(nextTurn());
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
    if (
      typeof intro === "string" ||
      (Array.isArray(intro) && typeof intro[0] === "string")
    ) {
      this.introActions = createChainableFunction([
        new SequentialText(intro, true),
        () => this.goToStartingRoom()
      ]);
    } else {
      throw Error("Intro must be a string or a string array.");
    }
  }

  goToStartingRoom() {
    this.room = this._startingRoom;
    return this._startingRoom.textWrapper;
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
    room.revealItems();
  }

  get room() {
    return this._room;
  }

  addEvent(event) {
    this.events.push(event);
  }
}
