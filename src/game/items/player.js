import { Item } from "./item";

export class Player extends Item {
  constructor() {
    super("player", "You look as you normally do.", false);

    // To be used by games as they wish
    this.stats = {};
  }

  get stats() {
    return this._stats;
  }

  set stats(stats) {
    this._stats = stats;
  }
}
