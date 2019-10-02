export default class Item {
  constructor(name, description, holdable, size, verbs) {
    this.name = name;
    this.description = description;
    this.holdable = holdable;
    this.size = size;

    if (verbs) {
      this.verbs = verbs;
    }
  }

  addVerb(verb) {
    this._verbs[verb.name] = verb;
  }

  get verbs() {
    return this._verbs;
  }

  /**
   * @param {Verb[] | Verb} verbs
   */
  set verbs(verbs) {
    this._verbs = {};
    const verbArray = Array.isArray(verbs) ? verbs : [verbs];
    verbArray.forEach(verb => this.addVerb(verb));
  }

  try(verbName, ...args) {
    const verb = this.verbs[verbName];

    if (verb) {
      verb.attempt(this, ...args);
    }
  }
}
