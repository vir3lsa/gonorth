import { createDynamicText } from "../../utils/dynamicDescription";
import { Verb } from "../verbs/verb";
import { Item } from "./item";

export function newContainer(config) {
  const {
    name,
    aliases,
    closedDescription,
    openDescription,
    capacity,
    preposition,
    locked,
    open,
    holdable,
    size,
    closeable,
    verbs,
    lockable,
    key,
    ...remainingConfig
  } = config;
  const container = new Container(
    name,
    aliases,
    closedDescription,
    openDescription,
    capacity,
    preposition,
    locked,
    open,
    holdable,
    size,
    closeable,
    lockable,
    key
  );

  if (verbs) {
    container.addVerbs(...verbs);
  }

  Object.entries(remainingConfig).forEach(([key, value]) => (container[key] = value));

  return container;
}

export class Container extends Item {
  constructor(
    name,
    aliases,
    closedDescription,
    openDescription,
    capacity = 5,
    preposition = "in",
    locked = false,
    open = false,
    holdable = false,
    size = 1,
    closeable = true,
    lockable = false,
    key
  ) {
    const dynamicOpenDescription = createDynamicText(openDescription);
    const dynamicClosedDescription = createDynamicText(closedDescription);
    super(
      name,
      () => (this.open ? dynamicOpenDescription({ item: this }) : dynamicClosedDescription({ item: this })),
      holdable,
      size,
      [],
      aliases || []
    );
    this.canHoldItems = true;
    this.capacity = capacity;
    this.preposition = preposition;
    this.itemsVisibleFromSelf = open;
    this.open = open;
    this.locked = locked;
    this.closeable = closeable;
    this.lockable = lockable;
    this.key = key;
    this.lockedText = `The ${this.name} is locked.`;
    this.openText = `The ${this.name} opens easily.`;
    this.alreadyOpenText = `The ${this.name} is already open.`;
    this.closeText = `You close the ${this.name} with a soft thud.`;
    this.alreadyClosedText = `The ${this.name} is already closed.`;
    this.wrongKeyText = `The key doesn't fit.`;
    this.needsKeyText = `The ${name} appears to need a key.`;
    this.alreadyUnlockedText = `The ${name} is already unlocked.`;

    if (this.closeable) {
      this.openVerb = new Verb(
        "open",
        ({ item }) => !item.open && !item.locked,
        [
          ({ item }) => (item.open = true),
          ({ item }) => (item.itemsVisibleFromSelf = true),
          ({ item }) => item.openText
        ],
        ({ item }) => {
          if (item.locked) return item.lockedText;
          return item.alreadyOpenText;
        }
      );

      this.closeVerb = new Verb(
        "close",
        ({ item }) => item.open && !item.locked,
        [
          ({ item }) => {
            // Ensure we don't return false to avoid breaking the action chain.
            item.open = false;
          },
          ({ item }) => {
            item.itemsVisibleFromSelf = false;
          },
          ({ item }) => item.closeText
        ],
        ({ item }) => {
          if (item.locked) return item.lockedText;
          return item.alreadyClosedText;
        },
        ["shut"]
      );

      this.addVerbs(this.openVerb, this.closeVerb);
    }

    if (this.lockable) {
      this.addVerb(
        new Verb.Builder("unlock")
          .withTest(
            ({ item: container, other: key }) =>
              container.locked && (container.key ? container.key === key?.name : true)
          )
          .withOnSuccess(
            ({ item: container }) => {
              // Ensure we don't return false to avoid breaking the action chain.
              container.locked = false;
            },
            ({ item: container }) =>
              this.unlockSuccessText ||
              (container.key ? "The key turns easily in the lock." : `The ${name} unlocks with a soft *click*.`)
          )
          .withOnFailure(({ item: container, other: key }) => {
            if (container.key && key && container.key !== key.name) {
              return this.wrongKeyText;
            } else if (container.key && !key) {
              return this.needsKeyText;
            } else {
              return this.alreadyUnlockedText;
            }
          })
          .makePrepositional("with what", true)
          .build()
      );
    }
  }

  addOpenAliases(...aliases) {
    this.open.aliases = [...this.open.aliases, ...aliases];
  }

  addCloseAliases(...aliases) {
    this.close.aliases = [...this.close.aliases, ...aliases];
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

  get lockedText() {
    return this._lockedText;
  }

  set lockedText(text) {
    this.recordAlteredProperty("lockedText", text);
    this._lockedText = text;
  }

  get openText() {
    return this._openText;
  }

  set openText(text) {
    this.recordAlteredProperty("openText", text);
    this._openText = text;
  }

  get alreadyOpenText() {
    return this._alreadyOpenText;
  }

  set alreadyOpenText(text) {
    this.recordAlteredProperty("alreadyOpenText", text);
    this._alreadyOpenText = text;
  }

  get closeText() {
    return this._closeText;
  }

  set closeText(text) {
    this.recordAlteredProperty("closeText", text);
    this._closeText = text;
  }

  get alreadyClosedText() {
    return this._alreadyClosedText;
  }

  set alreadyClosedText(text) {
    this.recordAlteredProperty("alreadyClosedText", text);
    this._alreadyClosedText = text;
  }

  get wrongKeyText() {
    return this._wrongKeyText;
  }

  set wrongKeyText(text) {
    this._wrongKeyText = text;
    this.recordAlteredProperty("wrongKeyText", text);
  }

  get needsKeyText() {
    return this._needsKeyText;
  }

  set needsKeyText(text) {
    this._needsKeyText = text;
    this.recordAlteredProperty("needsKeyText", text);
  }

  get alreadyUnlockedText() {
    return this._alreadyUnlockedText;
  }

  set alreadyUnlockedText(text) {
    this._alreadyUnlockedText = text;
    this.recordAlteredProperty("alreadyUnlockedText", text);
  }

  get unlockSuccessText() {
    return this._unlockSuccessText;
  }

  set unlockSuccessText(text) {
    this._unlockSuccessText = text;
    this.recordAlteredProperty("unlockSuccessText", text);
  }

  get key() {
    return this._key;
  }

  set key(key) {
    if (key) {
      this._key = typeof key === "string" ? key : key.name;
      this.recordAlteredProperty("key", this._key);
    }
  }

  static get Builder() {
    return Builder;
  }
}

class Builder {
  constructor(name) {
    this.config = { name };
  }

  withName(name) {
    this.config.name = name;
    return this;
  }

  isHoldable(holdable = true) {
    this.config.holdable = holdable;
    return this;
  }

  withSize(size) {
    this.config.size = size;
    return this;
  }

  withVerbs(...verbs) {
    this.config.verbs = verbs;
    return this;
  }

  withAliases(...aliases) {
    this.config.aliases = aliases;
    return this;
  }

  hidesItems(...items) {
    this.config.hidesItems = items;
    return this;
  }

  withContainerListing(containerListing) {
    this.config.containerListing = containerListing;
    return this;
  }

  withCloseText(closeText) {
    this.config.closeText = closeText;
    return this;
  }

  withClosedDescription(closedDescription) {
    this.config.closedDescription = closedDescription;
    return this;
  }

  withOpenText(openText) {
    this.config.openText = openText;
    return this;
  }

  withOpenDescription(openDescription) {
    this.config.openDescription = openDescription;
    return this;
  }

  withLockedText(lockedText) {
    this.config.lockedText = lockedText;
    return this;
  }

  withCapacity(capacity) {
    this.config.capacity = capacity;
    return this;
  }

  withPreposition(preposition) {
    this.config.preposition = preposition;
    return this;
  }

  isLocked(locked = true) {
    this.config.locked = locked;
    return this;
  }

  isOpen(open = true) {
    this.config.open = open;
    return this;
  }

  isCloseable(closeable = true) {
    this.config.closeable = closeable;
    return this;
  }

  isItemsVisibleFromSelf(itemsVisibleFromSelf = true) {
    this.config.itemsVisibleFromSelf = itemsVisibleFromSelf;
    return this;
  }

  isLockable(lockable = true) {
    this.config.lockable = lockable;
    return this;
  }

  withKey(key) {
    this.config.key = key;
    return this;
  }

  withWrongKeyText(text) {
    this.config.wrongKeyText = text;
    return this;
  }

  withNeedsKeyText(text) {
    this.config.needsKeyText = text;
    return this;
  }

  withAlreadyUnlockedText(text) {
    this.config.alreadyUnlockedText = text;
    return this;
  }

  withUnlockSuccessText(text) {
    this.config.unlockSuccessText = text;
    return this;
  }

  build() {
    return newContainer(this.config);
  }
}
