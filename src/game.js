import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { output } from "./output";
import IODevice from "./iodevice";
import { store } from "./redux/store";
import { changeOutput } from "./redux/gameActions";

const formatTitle = title =>
  [...title]
    .map((c, i) => {
      return `${c}${i === title.length - 1 ? "" : " "}`;
    })
    .join("");

export default class Game {
  constructor(title, debugMode) {
    this.title = title;
    this.debugMode = debugMode;
    this.container = null;
  }

  attach(container) {
    if (!container) {
      throw Error("No container provided");
    }

    this.container = container;
    this.renderTopLevel();
  }

  play() {
    const output = formatTitle(this.title || "Untitled");
    store.dispatch(changeOutput(output));
    this.renderTopLevel();
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

    if (!this.container || this.debugMode) {
      output(store.getState().game.output);
    }
  }
}
