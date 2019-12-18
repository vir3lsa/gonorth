import Item from "./item";
import { Verb } from "../verbs/verb";

export default class Door extends Item {
  constructor(
    name,
    description,
    open = true,
    locked = false,
    openSuccessText,
    unlockSuccessText,
    aliases
  ) {
    super(name, description, false, -1, [], aliases);

    this.addVerb(
      new Verb(
        "open",
        helper => !helper.object.locked && !helper.object.open,
        [
          helper => (helper.object.open = true),
          openSuccessText || `The ${name} opens relatively easily.`
        ],
        helper =>
          helper.object.open
            ? `The ${name} is already open.`
            : `The ${name} is locked.`,
        [],
        false,
        this
      )
    );

    this.addVerb(
      new Verb(
        "close",
        helper => helper.object.open,
        [helper => (helper.object.open = false), `You close the ${name}.`],
        `The ${name} is already closed.`,
        [],
        false,
        this
      )
    );

    this.addVerb(
      new Verb(
        "unlock",
        helper => helper.object.locked,
        [
          helper => (helper.object.locked = false),
          unlockSuccessText || `The ${name} unlocks with a soft *click*.`
        ],
        `The ${name} is already unlocked.`,
        [],
        false,
        this
      )
    );

    this.open = open;
    this.locked = locked;
  }
}
