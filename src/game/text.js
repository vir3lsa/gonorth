export class Text {
  constructor(texts) {
    this.texts = texts;
    this.index = -1;
  }

  set texts(texts = []) {
    this._texts = Array.isArray(texts) ? texts : [texts];
  }
}

export class CyclicText extends Text {
  constructor(texts) {
    super(texts);
  }

  get text() {
    this.index++;

    if (this.index > this._texts.length - 1) {
      this.index = 0;
    }

    return this._texts[this.index];
  }

  isLastPage() {
    return this.index === this._texts.length - 1;
  }
}

export class SequentialText extends CyclicText {
  constructor(texts, paged) {
    super(texts);
    this.paged = paged;
  }
}

export class RandomText extends Text {
  constructor(texts) {
    super(texts);
  }

  get text() {
    const oldIndex = this.index;

    while (this._texts.length > 1 && this.index === oldIndex) {
      this.index = Math.floor(Math.random() * this._texts.length);
    }

    return this._texts[this.index];
  }
}
