import { Item, Verb } from "../../../../lib/gonorth";

export class Potion extends Item {
  clone() {
    const copy = new Potion(`${this.name} copy`, this.description, this.drinkable, [...this.drinkEffects]);
    copy.name = this.name; // Set the real name - okay for a clone because it won't be serialized.
    return copy;
  }

  constructor(name, description, drinkable = false, ...drinkEffects) {
    super(name, description, true, 1);
    this.drinkable = drinkable;
    this.drinkEffects = drinkEffects;

    const drink = new Verb(
      "drink",
      ({ item }) => item.drinkable,
      [({ item }) => item.container.removeItem(item), ...this.drinkEffects],
      ({ item }) =>
        `Other than leaving a foul taste in your mouth and the vague feeling of regret in your heart, there's no discernible effect from drinking the ${item.name}.`,
      ["swallow"]
    );

    const pour = new Verb(
      "pour",
      false,
      null,
      ({ item, other }) =>
        `You carefully pour a drop of the potion onto the ${other.name} but nothing happens. It doesn't appear to be affected by the ${item.name}.`,
      ["tip", "apply"]
    );
    pour.makePrepositional("on what");

    this.addVerbs(drink, pour);
    this.addAliases("potion");
  }

  static get Builder() {
    return PotionBuilder;
  }
}

class PotionBuilder {
  constructor(name) {
    this.name = name;
    this.drinkEffects = [];
    this.aliases = [];
  }

  withName(name) {
    this.name = name;
    return this;
  }

  withAliases(...aliases) {
    this.aliases = aliases;
    return this;
  }

  withDescription(description) {
    this.description = description;
    return this;
  }

  isDrinkable(drinkable = true) {
    this.drinkable = drinkable;
    return this;
  }

  withDrinkEffects(...effects) {
    this.drinkEffects = effects;
    return this;
  }

  build() {
    const potion = new Potion(this.name, this.description, this.drinkable, ...this.drinkEffects);
    potion.addAliases(...this.aliases);
    return potion;
  }
}
