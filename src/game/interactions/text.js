export class Text {
  constructor(...texts) {
    this.texts = texts;
    this.index = -1;
    this.cycles = 0;
    this._resetCandidates();
  }

  _resetCandidates() {
    this.candidates = this._texts.map((_, index) => index);
  }

  clone() {
    return new Text(...this.texts);
  }

  set texts(texts) {
    this._texts = Array.isArray(texts) ? texts : [texts];
  }

  get text() {
    return this._texts[this.index];
  }

  get texts() {
    return this._texts;
  }

  next(...args) {
    const text = this.text;
    this.candidates = this.candidates.filter((c) => c !== this.index);

    if (!this.candidates.length) {
      this.cycles++;
      this._resetCandidates();
    }

    return typeof text === "function" ? text(...args) : text;
  }
}

export class CyclicText extends Text {
  constructor(...texts) {
    super(...texts);
  }

  clone() {
    return new CyclicText(...this.texts);
  }

  next(...args) {
    this.index++;

    if (this.index > this._texts.length - 1) {
      this.index = 0;
    }

    return super.next(...args);
  }
}

export class SequentialText extends CyclicText {
  constructor(...texts) {
    super(...texts);
  }

  clone() {
    return new SequentialText(...this.texts);
  }
}

export class PagedText extends SequentialText {
  constructor(...texts) {
    super(...texts);
    this.paged = true;
  }

  clone() {
    return new PagedText(...this.texts);
  }
}

export class RandomText extends Text {
  constructor(...texts) {
    super(...texts);
  }

  clone() {
    return new RandomText(...this.texts);
  }

  next(...args) {
    const candidatesIndex = Math.floor(Math.random() * this.candidates.length);
    this.index = this.candidates[candidatesIndex];

    return super.next(...args);
  }
}

export class ManagedText {
  static get Builder() {
    class Builder {
      constructor() {
        this.phases = [];
      }

      withText(text) {
        this.phases.push({ text, times: 1 });
        return this;
      }

      times(times) {
        this.phases[this.phases.length - 1].times = times;
        return this;
      }

      build() {
        return new ManagedText(this);
      }
    }

    return Builder;
  }

  constructor(builder) {
    this.phases = builder.phases;
    this.phaseNum = 0;
  }

  next() {
    let phase = this.phases[this.phaseNum];

    if (phase.text.cycles >= phase.times && this.phaseNum < this.phases.length - 1) {
      this.phaseNum++;
      phase = this.phases[this.phaseNum];
    }

    return phase.text.next();
  }
}

/*
 * Text that cycles through sequentially once, before becoming random.
 */
export class DeferredRandomText extends ManagedText {
  constructor(...texts) {
    super(new ManagedText.Builder().withText(new CyclicText(...texts)).withText(new RandomText(...texts)));
    this.texts = texts;
  }

  clone() {
    return new DeferredRandomText(...this.texts);
  }
}
