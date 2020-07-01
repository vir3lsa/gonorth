import { Verb, Item } from "../../../../lib/gonorth";

export class MagicWord extends Item {
  constructor(name, aliases, sayingDescription) {
    super(name);
    this.magicWord = true;
    this.aliases = aliases;
    this.doNotList = true; // Hides word from normal inventory check
    this._verbs = {};
    this.addVerb(
      new Verb("say", true, `${sayingDescription} ${name}.`, null, [
        "speak",
        "intone",
        "recite",
        "chant"
      ])
    );
  }
}
