import { selectRecordChanges } from "../../utils/selectors";

export class Text {
  [propertyName: string]: unknown;
  private _alteredProperties: AlteredProperties;
  private _texts!: TextPart[];
  private _index!: number;
  private _cycles!: number;
  private _candidates!: number[];
  private _onChange!: SimpleAction;
  private _partial!: boolean;
  protected _paged!: boolean;

  constructor(...texts: TextPart[]) {
    this._alteredProperties = new Set();
    this.onChange = () => {};

    this.texts = texts;
    this.index = -1;
    this.cycles = 0;
    this._paged = false;
    this._resetCandidates();

    // If recording has started, this Text will need to be reconstructed entirely on deserialization.
    this.partial = !selectRecordChanges();
  }

  _resetCandidates() {
    this.candidates = this._texts.map((_, index) => index);
  }

  clone() {
    return new Text(...this.texts);
  }

  set texts(texts: TextPart[]) {
    this._texts = Array.isArray(texts) ? texts : [texts];
    this.recordAlteredProperty("texts", texts);
  }

  get text() {
    return this._texts[this.index];
  }

  get texts() {
    return this._texts;
  }

  get index() {
    return this._index;
  }

  set index(value) {
    this._index = value;
    this.recordAlteredProperty("index", value);
  }

  get cycles() {
    return this._cycles;
  }

  set cycles(value) {
    this._cycles = value;
    this.recordAlteredProperty("cycles", value);
  }

  get candidates() {
    return this._candidates;
  }

  set candidates(value) {
    this._candidates = value;
    this.recordAlteredProperty("candidates", value);
  }

  get type() {
    return "Text";
  }

  get onChange() {
    return this._onChange;
  }

  set onChange(value) {
    this._onChange = value;
  }

  get partial() {
    return this._partial;
  }

  set partial(value) {
    this._partial = value;
  }

  get paged() {
    return this._paged;
  }

  recordAll() {
    this.partial = false;
    this.recordAlteredProperty("texts", this.texts);
    this.recordAlteredProperty("index", this.index);
    this.recordAlteredProperty("cycles", this.cycles);
    this.recordAlteredProperty("candidates", this.candidates);
  }

  /**
   * Converts a TextPart to a string by recursively invoking functions and
   * calling Text#next until a string is yielded.
   * @param textPart The TextPart
   * @param args Additional arguments to pass to functions
   * @returns
   */
  textPartToString(textPart: TextPart, ...args: unknown[]): string {
    if (typeof textPart === "function") {
      const newText = textPart(...args);
      return this.textPartToString(newText, ...args);
    } else if (textPart instanceof Text || textPart instanceof ManagedText) {
      return textPart.next(...args);
    }

    return textPart;
  }

  next(...args: unknown[]): string {
    const text = this.text;
    this.candidates = this.candidates.filter((c) => c !== this.index);

    if (!this.candidates.length) {
      this.cycles++;
      this._resetCandidates();
    }

    return this.textPartToString(text, ...args);
  }

  toJSON() {
    return [...this._alteredProperties, ...(!this._partial ? ["type"] : [])].reduce(
      (acc, propertyName) => {
        acc[propertyName] = this[propertyName];
        return acc;
      },
      { isText: true, partial: this._partial } as JsonDict
    );
  }

  // Records an altered property.
  recordAlteredProperty(propertyName: string, newValue: unknown) {
    const recordChanges = selectRecordChanges();
    if (recordChanges && typeof newValue === "function") {
      throw Error(
        `Updated text property "${propertyName}" to a function. This is non-serializable and hence can't be recorded into the save file.`
      );
    }

    if (recordChanges) {
      this._alteredProperties.add(propertyName);
      this.onChange();
    }
  }
}

export class CyclicText extends Text {
  constructor(...texts: TextPart[]) {
    super(...texts);
  }

  get type() {
    return "CyclicText";
  }

  clone() {
    return new CyclicText(...this.texts);
  }

  next(...args: unknown[]) {
    this.index++;

    if (this.index > this.texts.length - 1) {
      this.index = 0;
    }

    return super.next(...args);
  }
}

/**
 * An immutable Text type that concatenates all its values with blank lines.
 */
export class ConcatText extends Text {
  separator: string;

  constructor(...texts: TextPart[]) {
    super(...texts);
    this.separator = "\n\n";
  }

  get type() {
    return "ConcatText";
  }

  clone() {
    return new ConcatText(...this.texts);
  }

  next(...args: unknown[]) {
    return this.texts
      .filter((text) => text)
      .map((text) => this.textPartToString(text, ...args))
      .join(this.separator);
  }
}

/**
 * A ConcatText with a custom separator.
 */
export class JoinedText extends ConcatText {
  constructor(separator: string, ...texts: TextPart[]) {
    super(...texts);
    this.separator = separator;
  }

  get type() {
    return "JoinedText";
  }

  clone() {
    return new JoinedText(this.separator, ...this.texts);
  }
}

export class SequentialText extends CyclicText {
  constructor(...texts: TextPart[]) {
    super(...texts);
  }

  get type() {
    return "SequentialText";
  }

  clone() {
    return new SequentialText(...this.texts);
  }
}

export class PagedText extends SequentialText {
  constructor(...texts: TextPart[]) {
    super(...texts);
    this._paged = true;
  }

  get type() {
    return "PagedText";
  }

  clone() {
    return new PagedText(...this.texts);
  }
}

export class RandomText extends Text {
  constructor(...texts: TextPart[]) {
    super(...texts);
  }

  get type() {
    return "RandomText";
  }

  clone() {
    return new RandomText(...this.texts);
  }

  next(...args: unknown[]) {
    const candidatesIndex = Math.floor(Math.random() * this.candidates.length);
    this.index = this.candidates[candidatesIndex];

    return super.next(...args);
  }
}

export class ManagedText {
  static get Builder() {
    return ManagedTextBuilder;
  }

  [propertyName: string]: unknown;
  private _alteredProperties: AlteredProperties;
  private _phaseNum!: number;
  private _onChange!: SimpleAction;
  private _partial!: boolean;
  phases: ManagedTextPhase[];

  constructor(builder: ManagedTextBuilder) {
    this._alteredProperties = new Set();
    this.onChange = builder.onChangeCallback || (() => {});

    this.phases = builder.phases;
    this.phaseNum = 0;

    // If recording has started, this ManagedText will need to be reconstructed entirely on deserialization.
    this.partial = !selectRecordChanges();

    // Record phases for later reconstruction (if recording). Do it here as we don't need a setter for this.
    this.recordAlteredProperty("phases", this.phases);
  }

  get phaseNum() {
    return this._phaseNum;
  }

  set phaseNum(value) {
    this._phaseNum = value;
    this.recordAlteredProperty("phaseNum", value);
  }

  get type() {
    return "ManagedText";
  }

  get onChange() {
    return this._onChange;
  }

  set onChange(value) {
    this._onChange = value;
  }

  get partial() {
    return this._partial;
  }

  set partial(value) {
    this._partial = value;
  }

  recordAll() {
    this.partial = false;
    this.recordAlteredProperty("phases", this.phases);
    this.recordAlteredProperty("phaseNum", this.phaseNum);

    // Ensure the texts contained within are also recorded.
    this.phases.forEach((phase) => phase.text.recordAll());
  }

  next() {
    let phase = this.phases[this.phaseNum];

    if (phase.text.cycles >= phase.times && this.phaseNum < this.phases.length - 1) {
      this.phaseNum++;
      phase = this.phases[this.phaseNum];
    }

    return phase.text.next();
  }

  toJSON() {
    return [...this._alteredProperties, ...(!this._partial ? ["type"] : [])].reduce(
      (acc, propertyName) => {
        acc[propertyName] = this[propertyName];
        return acc;
      },
      { isText: true, partial: this._partial } as JsonDict
    );
  }

  // Records an altered property.
  recordAlteredProperty(propertyName: string, newValue: unknown) {
    const recordChanges = selectRecordChanges();
    if (recordChanges && typeof newValue === "function") {
      throw Error(
        `Updated ManagedText property "${propertyName}" to a function. This is non-serializable and hence can't be recorded into the save file.`
      );
    }

    if (recordChanges) {
      this._alteredProperties.add(propertyName);
      this.onChange();
    }
  }
}

export class ManagedTextBuilder {
  phases: ManagedTextPhase[];
  onChangeCallback: SimpleAction | undefined;

  constructor() {
    this.phases = [];
  }

  withText(text: Text) {
    this.phases.push({ text, times: 1 });
    return this;
  }

  times(times: number) {
    this.phases[this.phases.length - 1].times = times;
    return this;
  }

  onChange(callback: SimpleAction) {
    this.onChangeCallback = callback;
    return this;
  }

  build() {
    return new ManagedText(this);
  }
}

/*
 * Text that cycles through sequentially once, before becoming random.
 */
export class DeferredRandomText extends ManagedText {
  texts: TextPart[];

  constructor(...texts: TextPart[]) {
    super(new ManagedText.Builder().withText(new CyclicText(...texts)).withText(new RandomText(...texts)));
    this.texts = texts;
  }

  get type() {
    return "DeferredRandomText";
  }

  clone() {
    return new DeferredRandomText(...this.texts);
  }
}
