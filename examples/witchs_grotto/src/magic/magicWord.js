export class MagicWord {
  constructor(name, aliases) {
    this.name = name;
    this.aliases = aliases;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get aliases() {
    return this._aliases;
  }

  /**
   * @param {string | string[]} aliases
   */
  set aliases(aliases) {
    const aliasArray = Array.isArray(aliases) ? aliases : [aliases];
    this._aliases = aliasArray;
  }
}
