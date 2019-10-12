import Option from "./option";
import { changeInteraction } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";

/**
 * Replaces the current screen contents and displays text and prompts for user input, whether
 * free text or a series of options.
 */
export class Interaction {
  constructor(pages, options, page) {
    this.pages = Array.isArray(pages) ? pages : [pages];
    this.page = page || 0;

    if (options) {
      this._options = Array.isArray(options) ? options : [options];
    } else {
      this._options = null;
    }
  }

  get currentPage() {
    return this.pages[this.page];
  }

  get options() {
    if (this.page < this.pages.length - 1) {
      return [
        new Option("Next", () => {
          getStore().dispatch(
            changeInteraction(
              new Interaction(this.pages, this._options, this.page + 1)
            )
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
