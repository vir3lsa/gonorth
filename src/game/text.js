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
  constructor(texts, paged) {
    super(texts);
    this.paged = paged;
  }

  get text() {
    this.index++;

    if (this.index > this._texts.length - 1) {
      this.index = 0;
    }

    return this._texts[this.index];
  }

  isLastPage() {
    return this.index === this.texts.length - 1;
  }
}

export class RandomText extends Text {
  constructor(texts) {
    super(texts);
  }

  get text() {
    const oldIndex = this.index;

    while (this.index === oldIndex) {
      this.index = Math.floor(Math.random() * this._texts.length);
    }

    return this._texts[this.index];
  }
}
