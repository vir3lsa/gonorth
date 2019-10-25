import Option from "./option";
import { changeInteraction } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText } from "./text";

/**
 * Replaces the current screen contents and displays text and prompts for user input, whether
 * free text or a series of options.
 */
export class Interaction {
  constructor(text, options, nextOnLastPage) {
    this.text = text;
    this.options = options;
    this.nextOnLastPage = nextOnLastPage;
    this.currentPage =
      typeof this._text === "string" ? this._text : this._text.next();
    this.promise = new Promise(res => (this.resolve = res));

    if (
      !nextOnLastPage &&
      (!(this._text instanceof SequentialText) || this._text.isLastPage())
    ) {
      // This interaction resolves immediately
      this.resolve();
    }
  }

  set text(text = "") {
    if (typeof text === "string") {
      this._text = text;
    } else {
      throw Error("Only strings may be used in Interactions");
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
    if (this._text instanceof SequentialText && !this._text.isLastPage()) {
      return [
        new Option("Next", async () => {
          const interactionType = this._text.paged ? Interaction : Append;
          await getStore().dispatch(
            changeInteraction(
              new interactionType(
                this._text,
                this._options,
                this.nextOnLastPage
              )
            )
          );
          // This interaction is finished
          this.resolve();
        })
      ];
    } else if (this.nextOnLastPage) {
      return [new Option("Next", () => this.resolve())];
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
