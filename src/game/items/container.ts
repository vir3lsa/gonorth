import { createDynamicText } from "../../utils/dynamicDescription";
import { Verb } from "../verbs/verb";
import { Item, Builder as ItemBuilder, customiseVerbs, omitAliases } from "./item";

export function newContainer(config: ContainerConfig & ItemConfig) {
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
    key,
    config
  );

  if (verbs) {
    container.addVerbs(...verbs);
  }

  Object.entries(remainingConfig).forEach(([key, value]) => (container[key] = value));
  customiseVerbs(config.verbCustomisations, container);

  // Remove unwanted aliases.
  omitAliases(config.omitAliases, container);

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
    key?: string | KeyT,
    config?: ContainerConfig
  ) {
    const dynamicOpenDescription = createDynamicText(openDescription);
    const dynamicClosedDescription = createDynamicText(closedDescription);
    super(
      name,
      () => (this.open ? dynamicOpenDescription({ item: this }) : dynamicClosedDescription({ item: this })),
      holdable,
      size,
      [],
      aliases || [],
      undefined,
      config
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
    this.lockedText = `The ${this.name} ${this.isOrAre()} locked.`;
    this.openText = `The ${this.name} opens easily.`;
    this.alreadyOpenText = `The ${this.name} ${this.isOrAre()} already open.`;
    this.closeText = `You close the ${this.name} with a soft thud.`;
    this.alreadyClosedText = `The ${this.name} ${this.isOrAre()} already closed.`;
    this.wrongKeyText = `The key doesn't fit.`;
    this.needsKeyText = `The ${name} appears to need a key.`;
    this.alreadyUnlockedText = `The ${name} ${this.isOrAre()} already unlocked.`;

    if (this.closeable) {
      this.openVerb = new Verb.Builder("open")
        .withSmartTest(
          () => !this.open,
          () => this.alreadyOpenText
        )
        .withSmartTest(
          () => !this.locked,
          () => this.lockedText
        )
        .withOnSuccess(
          () => {
            this.open = true;
          },
          () => {
            this.itemsVisibleFromSelf = true;
          },
          () => this.openText
        )
        .build();

      this.closeVerb = new Verb.Builder("close")
        .withSmartTest(
          () => this.open,
          () => this.alreadyClosedText
        )
        .withSmartTest(
          () => !this.locked,
          () => this.lockedText
        )
        .withOnSuccess(
          () => {
            // Ensure we don't return false to avoid breaking the action chain.
            this.open = false;
          },
          () => {
            this.itemsVisibleFromSelf = false;
          },
          () => this.closeText
        )
        .withAliases("shut")
        .build();

      this.addVerbs(this.openVerb, this.closeVerb);
    }

    if (this.lockable) {
      this.addVerb(
        new Verb.Builder("unlock")
          .withSmartTest(
            () => this.locked,
            () => this.alreadyUnlockedText
          )
          .withSmartTest(
            ({ other: key }) => !this.key || Boolean(key),
            () => this.needsKeyText
          )
          .withSmartTest(
            ({ other: key }) => !this.key || key!.name === this.key || key!.name === (this.key as KeyT).name,
            () => this.wrongKeyText
          )
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

  withAlreadyOpenText(text: string) {
    this.config.alreadyOpenText = text;
    return this;
  }

  withAlreadyClosedText(text: string) {
    this.config.alreadyClosedText = text;
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
