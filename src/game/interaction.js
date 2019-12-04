import Option from "./option";

/**
 * Replaces the current screen contents and displays text and prompts for user input, whether
 * free text or a series of options.
 */
export class Interaction {
  constructor(text, options, renderNextButton) {
    this.text = text;
    this.renderNextButton = renderNextButton;
    this.options = options;
    this.currentPage =
      typeof this._text === "string" ? this._text : this._text.next();
    this.promise = new Promise(res => (this.resolve = res));

    if (!renderNextButton) {
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

  get currentPage() {
    return this._currentPage;
  }

  set currentPage(currentPage) {
    this._currentPage = currentPage;
  }

  set options(options) {
    if (options) {
      this._options = Array.isArray(options) ? options : [options];
    } else if (this.renderNextButton) {
      this._options = [new Option("Next", () => this.resolve())];
      this.nextButtonRendered = true;
    } else {
      this._options = null;
    }
  }

  get options() {
    return this._options;
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
    super(`###### \`>\` ${input}`, ...args);
  }
}
