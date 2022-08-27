import { Item } from "./item";

export class Player extends Item {
  constructor() {
    super("player", "You look as you normally do.", false);
  }
}
