export class Text {
  constructor(...texts) {
    this.texts = texts;
    this.index = -1;
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

  isLastPage() {
    return this.index === this._texts.length - 1;
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
    if (!this.candidates || !this.candidates.length) {
      this.candidates = [...this._texts];
    }

    this.index = Math.floor(Math.random() * this.candidates.length);
    const text = this.candidates[this.index];
    this.candidates = this.candidates.filter((c) => c !== text);

    return typeof text === "function" ? text(...args) : text;
  }
}
