import Option from "./option";
import { changeInteraction } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";
import { Text, PagedText } from "./text";

/**
 * Replaces the current screen contents and displays text and prompts for user input, whether
 * free text or a series of options.
 */
export class Interaction {
  constructor(text, options) {
    this.text = text;
    this.options = options;
    this.currentPage =
      typeof this._text === "string" ? this._text : this._text.text;
  }

  set text(text = "") {
    if (typeof text === "string" || text instanceof Text) {
      this._text = text;
    } else if (Array.isArray(text)) {
      this._text = new PagedText(text);
    } else {
      throw Error(
        "Only strings, arrays of strings, or Text instances may be used in Interactions"
      );
    }
  }

  set options(options) {
    if (options) {
      this._options = Array.isArray(options) ? options : [options];
    } else {
      this._options = null;
    }
  }

  get options() {
    return this._options;
  }

  get currentPage() {
    return this._currentPage;
  }

  set currentPage(currentPage) {
    this._currentPage = currentPage;
  }

  get options() {
    if (this._text.paged && !this._text.isLastPage()) {
      return [
        new Option("Next", () => {
          getStore().dispatch(
            changeInteraction(new Append(this._text, this._options))
          );
        })
      ];
    } else {
      return this._options;
    }
  }
}

/**
 * Adds new text to the output and may present new options, without clearing the
 * current output.
 */
export class Append extends Interaction {}

/**
 * Appends the most recent user input to the output if in the browser.
 */
export class AppendInput extends Append {
  constructor(input, ...args) {
    super(`\`>\` ${input}`, ...args);
  }
}
