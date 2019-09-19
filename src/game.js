import React from "react";
import ReactDOM from "react-dom";

import { output } from "./output";
import IODevice from "./iodevice";

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
    this.output = "Loading...";
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
    this.output = formatTitle(this.title || "Untitled");
    this.renderTopLevel();
  }

  renderTopLevel() {
    if (this.container) {
      this.component = <IODevice output={this.output} />;
      ReactDOM.render(this.component, this.container);
    }

    if (!this.container || this.debugMode) {
      output(this.output);
    }
  }
}
