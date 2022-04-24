import { Item } from "./item";

export class Player extends Item {
  constructor() {
    super("player", "You look as you normally do.", false);

    this.recordChanges = false;
    this._type = "Player";
    // To be used by games as they wish
    this.stats = {};
    this.recordChanges = true;
  }

  get stats() {
    return this._stats;
  }

  set stats(stats) {
    this._stats = stats;
  }
}
