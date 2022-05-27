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
    closeable
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
    closeable = true
  ) {
    const dynamicOpenDescription = createDynamicText(openDescription);
    const dynamicClosedDescription = createDynamicText(closedDescription);
    super(
      name,
      () => (this.open ? dynamicOpenDescription() : dynamicClosedDescription()),
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
    this.lockedText = `The ${this.name} is locked.`;
    this.openText = `The ${this.name} opens easily.`;
    this.alreadyOpenText = `The ${this.name} is already open.`;
    this.closeText = `You close the ${this.name} with a soft thud.`;
    this.alreadyClosedText = `The ${this.name} is already closed.`;

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
        ({ item }) => item.open,
        [
          ({ item }) => (item.open = false),
          ({ item }) => (item.itemsVisibleFromSelf = false),
          ({ item }) => item.closeText
        ],
        ({ item }) => item.alreadyClosedText,
        ["shut"]
      );

      this.addVerbs(this.openVerb, this.closeVerb);
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

  static get Builder() {
    return Builder;
  }
}

class Builder {
  constructor() {
    this.config = {};
  }

  withName(name) {
    this.config.name = name;
    return this;
  }

  isHoldable(holdable = true) {
    this.config.holdable = true;
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

  withClosedDescription(closedDescription) {
    this.config.closedDescription = closedDescription;
    return this;
  }

  withOpenDescription(openDescription) {
    this.config.openDescription = openDescription;
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

  build() {
    return newContainer(this.config);
  }
}
