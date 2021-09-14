import { Verb, Item } from "../../../../lib/gonorth";
import { alchemy } from "./cauldron";

export class MagicWord extends Item {
  constructor(name, aliases = [], sayingDescription, action = () => alchemy.sayWords(this), recall = true) {
    super(name);
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
}
