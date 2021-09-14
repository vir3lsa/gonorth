import { createDynamicText } from "../../utils/dynamicDescription";
import { Verb } from "../verbs/verb";
import { Item } from "./item";

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
    size = 1
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
    this.lockedText = `The ${this.name} is locked.`;
    this.openText = `The ${this.name} opens easily.`;
    this.alreadyOpenText = `The ${this.name} is already open.`;
    this.closeText = `You close the ${this.name} with a soft thud.`;
    this.alreadyClosedText = `The ${this.name} is already closed`;

    this.openVerb = new Verb(
      "open",
      () => !this.open && !this.locked,
      [() => (this.open = true), () => (this.itemsVisibleFromSelf = true), () => this.openText],
      () => {
        if (this.locked) return this.lockedText;
        return this.alreadyOpenText;
      }
    );

    this.closeVerb = new Verb(
      "close",
      () => this.open,
      [() => (this.open = false), () => (this.itemsVisibleFromSelf = false), () => this.closeText],
      () => this.alreadyClosedText,
      ["shut"]
    );

    this.addVerbs(this.openVerb, this.closeVerb);
  }

  addOpenAliases(...aliases) {
    this.open.aliases = [...this.open.aliases, ...aliases];
  }

  addCloseAliases(...aliases) {
    this.close.aliases = [...this.close.aliases, ...aliases];
  }

  get lockedText() {
    return this._lockedText;
  }

  set lockedText(text) {
    this._lockedText = text;
  }

  get openText() {
    return this._openText;
  }

  set openText(text) {
    this._openText = text;
  }

  get alreadyOpenText() {
    return this._alreadyOpenText;
  }

  set alreadyOpenText(text) {
    this._alreadyOpenText = text;
  }

  get closeText() {
    return this._closeText;
  }

  set closeText(text) {
    this._closeText = text;
  }

  get alreadyClosedText() {
    return this._alreadyClosedText;
  }

  set alreadyClosedText(text) {
    this._alreadyClosedText = text;
  }
}
