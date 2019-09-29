import Item from "./item";

export default class Door extends Item {
  constructor(name, open = true, locked = false) {
    super(name, false, -1, ["open", "unlock"]);
    this.open = open;
    this.locked = locked;
  }
}
