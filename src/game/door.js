import Item from "./item";
import Verb from "./verb";

export default class Door extends Item {
  constructor(name, description, open = true, locked = false) {
    super(name, description, false, -1, [
      new Verb(
        "open",
        door => (door.open = true),
        "It opens relatively easily.",
        "It's locked.",
        door => !door.locked
      ),
      new Verb(
        "unlock",
        door => (door.locked = false),
        "It unlocks with a soft click.",
        "It's already unlocked.",
        door => door.locked
      )
    ]);
    this.open = open;
    this.locked = locked;
  }
}
