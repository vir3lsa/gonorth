import Item from "./item";
import Verb from "./verb";

export default class Door extends Item {
  constructor(
    name,
    description,
    open = true,
    locked = false,
    openSuccessText,
    openFailureText,
    unlockSuccessText,
    unlockFailureText,
    aliases
  ) {
    super(
      name,
      description,
      false,
      -1,
      [
        new Verb(
          "open",
          door => (door.open = true),
          openSuccessText || "It opens relatively easily.",
          openFailureText || "It's locked.",
          door => !door.locked
        ),
        new Verb(
          "unlock",
          door => (door.locked = false),
          unlockSuccessText || "It unlocks with a soft click.",
          unlockFailureText || "It's already unlocked.",
          door => door.locked
        )
      ],
      aliases
    );
    this.open = open;
    this.locked = locked;
  }
}
