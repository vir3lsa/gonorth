import { Item } from "./item";
import { Verb } from "../verbs/verb";

export class Door extends Item {
  constructor(name, description, open = true, locked = false, openSuccessText, unlockSuccessText, aliases, key) {
    super(name, description, false, -1, [], aliases);

    this.addVerb(
      new Verb(
        "open",
        (helper) => !helper.object.locked && !helper.object.open,
        [(helper) => (helper.object.open = true), openSuccessText || `The ${name} opens relatively easily.`],
        (helper) => (helper.object.open ? `The ${name} is already open.` : `The ${name} is locked.`),
        [],
        false,
        null,
        this
      )
    );

    this.addVerb(
      new Verb(
        "close",
        (helper) => helper.object.open,
        [(helper) => (helper.object.open = false), `You close the ${name}.`],
        `The ${name} is already closed.`,
        [],
        false,
        null,
        this
      )
    );

    this.addVerb(
      new Verb(
        "unlock",
        (helper, key) => helper.object.locked && (this.key ? key?.name === this.key.name : true),
        [
          (helper) => (helper.object.locked = false),
          unlockSuccessText ||
            (this.key ? "The key turns easily in the lock." : `The ${name} unlocks with a soft *click*.`)
        ],
        () => {
          if (this.key && key && this.key.name !== key.name) {
            return `The ${key.name} doesn't fit.`;
          } else if (this.key && !key) {
            return `The ${name} appears to need a key.`;
          } else {
            return `The ${name} is already unlocked.`;
          }
        },
        [],
        false,
        null,
        this
      )
    );

    this.open = open;
    this.locked = locked;
    this.key = key;
  }

  get key() {
    return this._key;
  }

  set key(key) {
    this._key = key;
  }
}
