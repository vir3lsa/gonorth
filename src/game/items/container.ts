import { createDynamicText } from "../../utils/dynamicDescription";
import { normaliseTest } from "../../utils/sharedFunctions";
import { Verb } from "../verbs/verb";
import { Item, Builder as ItemBuilder, customiseVerbs } from "./item";

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
    items,
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

  container.addItems(...(items ?? []));

  Object.entries(remainingConfig).forEach(([key, value]) => (container[key] = value));
  customiseVerbs(config.verbCustomisations, container);

  return container;
}

export class Container extends Item {
  private __open!: boolean;
  private __locked!: boolean;
  private __onLocked!: Action;
  private __onOpen!: Action;
  private __onAlreadyOpen!: Action;
  private __onClose!: Action;
  private __onAlreadyClosed!: Action;
  private __onWrongKey!: Action;
  private __onNeedsKey!: Action;
  private __onAlreadyUnlocked!: Action;
  private __onUnlock?: Action;
  private __key?: string;
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
    this.onLocked = config?.onLocked ?? `The ${this.name} ${this.isOrAre} locked.`;
    this.onOpen = config?.onOpen ?? `The ${this.name} opens easily.`;
    this.onAlreadyOpen = config?.onAlreadyOpen ?? `The ${this.name} ${this.isOrAre} already open.`;
    this.onClose = config?.onClose ?? `You close the ${this.name} with a soft thud.`;
    this.onAlreadyClosed = config?.onAlreadyClosed ?? `The ${this.name} ${this.isOrAre} already closed.`;
    this.onWrongKey = config?.onWrongKey ?? `The key doesn't fit.`;
    this.onNeedsKey = config?.onNeedsKey ?? `The ${name} appears to need a key.`;
    this.onAlreadyUnlocked = config?.onAlreadyUnlocked ?? `The ${name} ${this.isOrAre} already unlocked.`;
    this.onUnlock = config?.onUnlock;

    if (this.closeable) {
      this.openVerb = new Verb.Builder("open")
        .withSmartTest(() => !this.open, this.onAlreadyOpen)
        .withSmartTest(() => !this.locked, this.onLocked)
        .withOnSuccess(
          () => {
            this.open = true;
          },
          () => {
            this.itemsVisibleFromSelf = true;
          },
          this.onOpen
        )
        .build();

      this.closeVerb = new Verb.Builder("close")
        .withSmartTest(() => this.open, this.onAlreadyClosed)
        .withSmartTest(() => !this.locked, this.onLocked)
        .withOnSuccess(
          () => {
            // Ensure we don't return false to avoid breaking the action chain.
            this.open = false;
          },
          () => {
            this.itemsVisibleFromSelf = false;
          },
          this.onClose
        )
        .withAliases("shut")
        .build();

      this.addVerbs(this.openVerb, this.closeVerb);
    }

    if (this.lockable) {
      this.addVerb(
        new Verb.Builder("unlock")
          .withSmartTest(() => this.locked, this.onAlreadyUnlocked)
          .withSmartTest(({ other: key }) => !this.key || Boolean(key), this.onNeedsKey)
          .withSmartTest(
            ({ other: key }) => !this.key || key!.name === this.key || key!.name === (this.key as KeyT).name,
            this.onWrongKey
          )
          .withOnSuccess(({ item: container }) => {
            // Ensure we don't return false to avoid breaking the action chain.
            container.locked = false;
          }, this.onUnlock || (({ item: container }) => ((container as Container).key ? "The key turns easily in the lock." : `The ${name} unlocks with a soft *click*.`)))
          .makePrepositional("with what", true)
          .build()
      );
    }

    if (config?.relinquishTests) {
      const relinquish = new Verb.Builder("__relinquish").isRemote();

      // Add each relinquish test as a smart test.
      config.relinquishTests.forEach((smartTest) => {
        let onFailure = (smartTest as SmartTest).onFailure as Action[];
        onFailure = Array.isArray(onFailure) ? onFailure : [onFailure];
        relinquish.withSmartTest(smartTest.test, ...onFailure);
      });

      this.addVerb(relinquish);
    }
  }

  addOpenAliases(...aliases: string[]) {
    this.verbs.open.aliases = [...this.verbs.open.aliases, ...aliases];
  }

  addCloseAliases(...aliases: string[]) {
    this.verbs.close.aliases = [...this.verbs.close.aliases, ...aliases];
  }

  get open() {
    return this.__open;
  }

  set open(value) {
    this.recordAlteredProperty("open", value);
    this.__open = value;
  }

  get locked() {
    return this.__locked;
  }

  set locked(value) {
    this.recordAlteredProperty("locked", value);
    this.__locked = value;
  }

  get onLocked() {
    return this.__onLocked;
  }

  set onLocked(value) {
    this.__onLocked = value;
  }

  get onOpen() {
    return this.__onOpen;
  }

  set onOpen(value) {
    this.__onOpen = value;
  }

  get onAlreadyOpen() {
    return this.__onAlreadyOpen;
  }

  set onAlreadyOpen(value) {
    this.__onAlreadyOpen = value;
  }

  get onClose() {
    return this.__onClose;
  }

  set onClose(value) {
    this.__onClose = value;
  }

  get onAlreadyClosed() {
    return this.__onAlreadyClosed;
  }

  set onAlreadyClosed(value) {
    this.__onAlreadyClosed = value;
  }

  get onWrongKey() {
    return this.__onWrongKey;
  }

  set onWrongKey(value) {
    this.__onWrongKey = value;
  }

  get onNeedsKey() {
    return this.__onNeedsKey;
  }

  set onNeedsKey(value) {
    this.__onNeedsKey = value;
  }

  get onAlreadyUnlocked() {
    return this.__onAlreadyUnlocked;
  }

  set onAlreadyUnlocked(value) {
    this.__onAlreadyUnlocked = value;
  }

  get onUnlock() {
    return this.__onUnlock;
  }

  set onUnlock(value) {
    this.__onUnlock = value;
  }

  get key(): string | KeyT | undefined {
    return this.__key;
  }

  set key(key: string | KeyT | undefined) {
    if (key) {
      this.__key = typeof key === "string" ? key : key.name;
      this.recordAlteredProperty("key", this.__key);
    }
  }

  static get Builder() {
    return ContainerBuilder;
  }
}

export class ContainerBuilder extends ItemBuilder {
  config!: ContainerConfig & ItemConfig;

  constructor(name?: string) {
    super(name);
    this.config.relinquishTests = [];
  }

  onClose(value: Action) {
    this.config.onClose = value;
    return this;
  }

  withClosedDescription(closedDescription: UnknownText) {
    this.config.closedDescription = closedDescription;
    return this;
  }

  onOpen(value: Action) {
    this.config.onOpen = value;
    return this;
  }

  withOpenDescription(openDescription: UnknownText) {
    this.config.openDescription = openDescription;
    return this;
  }

  onLocked(value: Action) {
    this.config.onLocked = value;
    return this;
  }

  withPreposition(preposition: string) {
    this.config.preposition = preposition;
    return this;
  }

  isLocked(locked = true) {
    this.config.locked = locked;

    if (locked) {
      this.config.lockable = true;
    }

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
    this.config.lockable = true;
    return this;
  }

  onWrongKey(value: Action) {
    this.config.onWrongKey = value;
    return this;
  }

  onNeedsKey(value: Action) {
    this.config.onNeedsKey = value;
    return this;
  }

  onAlreadyOpen(value: Action) {
    this.config.onAlreadyOpen = value;
    return this;
  }

  onAlreadyClosed(value: Action) {
    this.config.onAlreadyClosed = value;
    return this;
  }

  onAlreadyUnlocked(value: Action) {
    this.config.onAlreadyUnlocked = value;
    return this;
  }

  onUnlock(value: Action) {
    this.config.onUnlock = value;
    return this;
  }

  withRelinquishTest(test: Test, ...onFailure: Action[]) {
    this.config.relinquishTests.push({ test: normaliseTest(test), onFailure });
    return this;
  }

  build() {
    return newContainer(this.config);
  }
}
