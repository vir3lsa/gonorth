import Option from "./option";

export default class Interaction {
  constructor(pages, options) {
    this.pages = Array.isArray(pages) ? pages : [pages];
    this.page = 0;

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
      return [new Option("Next", () => this.page++)];
    } else {
      return this._options;
    }
  }
}
