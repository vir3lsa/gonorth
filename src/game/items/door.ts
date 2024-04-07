import { Item, customiseVerbs } from "./item";
import { Verb } from "../verbs/verb";

export function newDoor(config: DoorConfig & ItemConfig) {
  const { name, description, open, locked, openSuccessText, unlockSuccessText, aliases, key, ...remainingConfig } =
    config;
  const door = new Door(name, description, open, locked, openSuccessText, unlockSuccessText, aliases, key);
  Object.entries(remainingConfig).forEach(([key, value]) => (door[key] = value));

  customiseVerbs(config.verbCustomisations, door);

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
        .withSmartTest(() => !this.locked, `The ${name} is locked.`)
        .withSmartTest(() => !this.open, `The ${name} is already open.`)
        .withOnSuccess(() => {
          this.open = true;
        }, openSuccessText || `The ${name} opens relatively easily.`)
        .build()
    );

    this.addVerb(
      new Verb.Builder("close")
        .withSmartTest(() => this.open, `The ${name} is already closed.`)
        .withOnSuccess(() => {
          this.open = false;
        }, `You close the ${name}.`)
        .build()
    );

    this.addVerb(
      new Verb.Builder("unlock")
        .withSmartTest(() => this.locked, `The ${name} is already unlocked.`)
        .withSmartTest(({ other: key }) => !Boolean(this.key) || Boolean(key), `The ${name} appears to need a key.`)
        .withSmartTest(
          ({ other: key }) => (this.key ? this.key.name === key!.name : true),
          ({ other: key }) => `The ${key!.name} doesn't fit.`
        )
        .withOnSuccess([
          ({ item: door }) => {
            // Ensure we don't return false to avoid breaking the action chain.
            door.locked = false;
          },
          ({ item: door }) =>
            unlockSuccessText ||
            (door.key ? "The key turns easily in the lock." : `The ${name} unlocks with a soft *click*.`)
        ])
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

  static get Builder() {
    return DoorBuilder;
  }
}

class DoorBuilder extends Item.Builder {
  config!: DoorConfig & ItemConfig;

  constructor(name: string) {
    super(name);
  }

  isOpen(open = true) {
    this.config.open = open;
    return this;
  }

  isLocked(locked = true) {
    this.config.locked = locked;
    return this;
  }

  withOpenSuccessText(text: string) {
    this.config.openSuccessText = text;
    return this;
  }

  withUnlockSuccessText(text: string) {
    this.config.unlockSuccessText = text;
    return this;
  }

  withKey(key: Key) {
    this.config.key = key;
    return this;
  }

  build() {
    return newDoor(this.config);
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
