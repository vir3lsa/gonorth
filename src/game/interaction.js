import Option from "./option";
import { changeInteraction } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";

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

export class Append extends Interaction {}
