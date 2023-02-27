import { Option } from "./option";

/**
 * Replaces the current screen contents and displays text and prompts for user input, whether
 * free text or a series of options.
 */
export class Interaction {
  _text!: string;
  _currentPage!: string;
  _options?: OptionT[];
  renderNextButton: boolean;
  renderOptions: boolean;
  nextButtonRendered!: boolean;
  promise: Promise<void>;
  resolve!: (value: void | PromiseLike<void>) => void;

  constructor(text: string, options?: OptionT[], renderNextButton = false, renderOptions = false) {
    this.text = text;
    this.renderNextButton = renderNextButton;
    this.options = options;
    this.renderOptions = renderOptions;
    this.currentPage = this._text;
    this.promise = new Promise((res) => (this.resolve = res));

    if (!renderNextButton) {
      // This interaction resolves immediately
      this.resolve();
    }
  }

  set text(text: string) {
    if (typeof text === "string" || typeof text === "undefined") {
      this._text = text || "";
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
      this._options = undefined;
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
 * Appends the most recent user input to the output.
 */
export class AppendInput extends Append {
  constructor(input: string, options?: OptionT[], renderNextButton?: boolean, renderOptions = false) {
    super(`###### \`>\` ${input}`, options, renderNextButton, renderOptions);
  }
}
