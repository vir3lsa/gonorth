import { createDynamicText } from "../../utils/dynamicDescription";
import { Verb } from "../verbs/verb";
import { Item, Builder as ItemBuilder } from "./item";

export function newContainer(config: ContainerConfig) {
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
  private _open!: boolean;
  private _locked!: boolean;
  private _lockedText!: string;
  private _openText!: string;
  private _alreadyOpenText!: string;
  private _closeText!: string;
  private _alreadyClosedText!: string;
  private _wrongKeyText!: string;
  private _needsKeyText!: string;
  private _alreadyUnlockedText!: string;
  private _unlockSuccessText?: string;
  private _key?: string;
  openVerb?: VerbT;
  closeVerb?: VerbT;

  constructor(
    name: string,
    aliases: string[],
    closedDescription: UnknownText,
    openDescription: UnknownText,
    capacity = 5,
    preposition = "in",
    locked = false,
    open = false,
    holdable = false,
    size = 1,
    closeable = true,
    lockable = false,
    key?: string | KeyT
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
          ({ item }) => {
            item.open = true;
          },
          ({ item }) => {
            item.itemsVisibleFromSelf = true;
          },
          ({ item }) => item.openText
        ],
        ({ item }) => {
          const container = item as ContainerT;
          if (container.locked) return container.lockedText;
          return container.alreadyOpenText;
        }
      );

      this.closeVerb = new Verb(
        "close",
        ({ item }) => {
          const container = item as ContainerT;
          return container.open && !container.locked;
        },
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
          const container = item as Container;
          if (container.locked) return container.lockedText;
          return container.alreadyClosedText;
        },
        ["shut"]
      );

      this.addVerbs(this.openVerb, this.closeVerb);
    }

    if (this.lockable) {
      this.addVerb(
        new Verb.Builder("unlock")
          .withTest(({ item, other: key }) => {
            const container = item as Container;
            return container.locked && (container.key ? container!.key === key?.name : true);
          })
          .withOnSuccess(
            ({ item: container }) => {
              // Ensure we don't return false to avoid breaking the action chain.
              container.locked = false;
            },
            ({ item: container }) =>
              this.unlockSuccessText ||
              ((container as Container).key
                ? "The key turns easily in the lock."
                : `The ${name} unlocks with a soft *click*.`)
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

  addOpenAliases(...aliases: string[]) {
    this.verbs.open.aliases = [...this.verbs.open.aliases, ...aliases];
  }

  addCloseAliases(...aliases: string[]) {
    this.verbs.close.aliases = [...this.verbs.close.aliases, ...aliases];
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

  get key(): string | KeyT | undefined {
    return this._key;
  }

  set key(key: string | KeyT | undefined) {
    if (key) {
      this._key = typeof key === "string" ? key : key.name;
      this.recordAlteredProperty("key", this._key);
    }
  }

  static get Builder() {
    return Builder;
  }
}

class Builder extends ItemBuilder {
  config!: ContainerConfig & ItemConfig;

  constructor(name?: string) {
    super(name);
  }

  withCloseText(closeText: string) {
    this.config.closeText = closeText;
    return this;
  }

  withClosedDescription(closedDescription: UnknownText) {
    this.config.closedDescription = closedDescription;
    return this;
  }

  withOpenText(openText: string) {
    this.config.openText = openText;
    return this;
  }

  withOpenDescription(openDescription: UnknownText) {
    this.config.openDescription = openDescription;
    return this;
  }

  withLockedText(lockedText: string) {
    this.config.lockedText = lockedText;
    return this;
  }

  withPreposition(preposition: string) {
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

  withKey(key: string | KeyT) {
    this.config.key = key;
    return this;
  }

  withWrongKeyText(text: string) {
    this.config.wrongKeyText = text;
    return this;
  }

  withNeedsKeyText(text: string) {
    this.config.needsKeyText = text;
    return this;
  }

  withAlreadyUnlockedText(text: string) {
    this.config.alreadyUnlockedText = text;
    return this;
  }

  withUnlockSuccessText(text: string) {
    this.config.unlockSuccessText = text;
    return this;
  }

  build() {
    return newContainer(this.config);
  }
}
