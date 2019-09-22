import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { output } from "../utils/output";
import IODevice from "../web/iodevice";
import { store } from "../redux/store";
import { newGame, changeInteraction } from "../redux/gameActions";
import { LOADING, INTRO, ROOM } from "./gameState";
import Interaction from "./interaction";
import Option from "./option";

const formatTitle = title =>
  [...title]
    .map((c, i) => {
      return `${c}${i === title.length - 1 ? "" : " "}`;
    })
    .join("");

const selectOutput = state => state.game.interaction.currentPage;
let currentOutput = selectOutput(store.getState());

export default class Game {
  constructor(title, debugMode) {
    this.title = title;
    this.debugMode = debugMode;
    this.status = LOADING;
    this.container = null;
    this.author = null;
    this._intro = null;

    store.subscribe(() => {
      if (!this.container || this.debugMode) {
        let previousOutput = currentOutput;
        currentOutput = selectOutput(store.getState());

        if (previousOutput !== currentOutput) {
          output(currentOutput);
        }
      }
    });
  }

  attach(container) {
    if (!container) {
      throw Error("No container provided");
    }

    this.container = container;
    this.renderTopLevel();
  }

  play() {
    store.dispatch(newGame(this.container, this.debugMode));
    this.status = INTRO;
    let output = `# ${formatTitle(this.title || "Untitled")}`;

    if (this.author) {
      output += `\n### By ${this.author}`;
    }

    const titleScreen = new Interaction(
      output,
      new Option("Play", () => {
        store.dispatch(changeInteraction(this._intro));
        // Or go straight to first room if no intro
      })
    );

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
    if (Array.isArray(intro)) {
      this._intro = new Interaction(intro);
    } else {
      this._intro = new Interaction([intro]);
    }
  }
}
