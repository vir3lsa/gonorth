import { Item } from "./item";
import { Verb } from "../verbs/verb";

export function newDoor(config: DoorConfig) {
  const { name, description, open, locked, openSuccessText, unlockSuccessText, aliases, key, ...remainingConfig } =
    config;
  const door = new Door(name, description, open, locked, openSuccessText, unlockSuccessText, aliases, key);
  Object.entries(remainingConfig).forEach(([key, value]) => (door[key] = value));

  return door;
}

export class Door extends Item {
  private _open!: boolean;
  private _locked!: boolean;
  private _key?: KeyT;

  constructor(
    name: string,
    description: UnknownText,
    open = true,
    locked = false,
    openSuccessText?: string,
    unlockSuccessText?: string,
    aliases?: string[],
    key?: KeyT
  ) {
    super(name, description, false, -1, [], aliases);
    this.open = open;
    this.locked = locked;
    this.key = key;

    this.addVerb(
      new Verb.Builder("open")
        .withTest(({ item: door }) => !door.locked && !door.open)
        .withOnSuccess([
          ({ item: door }) => (door.open = true),
          openSuccessText || `The ${name} opens relatively easily.`
        ])
        .withOnFailure(({ item: door }) => (door.open ? `The ${name} is already open.` : `The ${name} is locked.`))
        .build()
    );

    this.addVerb(
      new Verb.Builder("close")
        .withTest(({ item: door }) => (door as Door).open)
        .withOnSuccess([({ item: door }) => (door.open = false), `You close the ${name}.`])
        .withOnFailure(`The ${name} is already closed.`)
        .build()
    );

    this.addVerb(
      new Verb.Builder("unlock")
        .withTest(({ item, other: key }) => {
          const door = item as DoorT;
          return door.locked && (door.key ? door.key.name === key?.name : true);
        })
        .withOnSuccess([
          ({ item: door }) => {
            // Ensure we don't return false to avoid breaking the action chain.
            door.locked = false;
          },
          ({ item: door }) =>
            unlockSuccessText ||
            (door.key ? "The key turns easily in the lock." : `The ${name} unlocks with a soft *click*.`)
        ])
        .withOnFailure(({ item, other: key }) => {
          const door = item as DoorT;

          if (door.key && key && door.key.name !== key.name) {
            return `The ${key.name} doesn't fit.`;
          } else if (door.key && !key) {
            return `The ${name} appears to need a key.`;
          } else {
            return `The ${name} is already unlocked.`;
          }
        })
        .build()
    );

    this.verbs.unlock.makePrepositional("with what", true);
  }

  get open() {
    return this._open;
  }

  set open(value) {
    this.recordAlteredProperty("open", value);
    this._open = value;
  }

  get locked() {
    return this._locked;
  }

  set locked(value) {
    this.recordAlteredProperty("locked", value);
    this._locked = value;
  }

  get key() {
    return this._key;
  }

  set key(key) {
    if (key && !(key instanceof Key)) {
      throw Error("Keys must be Key instances.");
    }

    this.recordAlteredProperty("key", key);
    this._key = key;
  }

  tryUnlock() {
    return this.verbs.unlock.attempt(this, this.key);
  }

  tryOpen() {
    return this.verbs.open.attempt(this);
  }

  tryClose() {
    return this.verbs.close.attempt(this);
  }
}

/*
 * Item subclass acting as a key. No special functionality, but doors expect keys to be instances
 * of this class.
 */
export class Key extends Item {
  clone(): KeyT {
    return super.clone(Key);
  }
}
