import { Verb, Item } from "../../../../lib/gonorth";
import { getAlchemy } from "./cauldron";

export class MagicWord extends Item {
  clone() {
    const clone = super.clone();
    clone.recall = this.recall;
    return clone;
  }

  constructor(name, aliases = [], sayingDescription, action = () => getAlchemy().sayWords(this), recall = true) {
    super(name, "It's more of a concept than a physical thing.", true);
    this.size = 0;
    this.aliases = aliases || [];
    this.recall = recall; // Whether to include in 'recalled' magic words.
    this.doNotList = true; // Hides word from normal inventory check.
    this._verbs = {};
    this.addVerb(
      new Verb(
        "say",
        true,
        // Nested array components are concatenated.
        [[sayingDescription, action]],
        null,
        ["speak", "intone", "recite", "chant"]
      )
    );
  }

  static get Builder() {
    return MagicWordBuilder;
  }
}

class MagicWordBuilder {
  constructor(name) {
    this.config = { name };
  }

  withAliases(...aliases) {
    this.config.aliases = aliases;
    return this;
  }

  withSayingDescription(description) {
    this.config.sayingDescription = description;
    return this;
  }

  withAction(action) {
    this.config.action = action;
    return this;
  }

  recall(recall = true) {
    this.config.recall = recall;
    return this;
  }

  build() {
    return new MagicWord(
      this.config.name,
      this.config.aliases,
      this.config.sayingDescription,
      this.config.action,
      this.config.recall
    );
  }
}
