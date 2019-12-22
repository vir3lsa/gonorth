import { Item } from "../../../../lib/gonorth";

export class Ingredient extends Item {
  constructor(name, description, cauldron) {
    super(name, description, true, 1);
    this.article = "";
    this.verbs["put"].onSuccess = [
      (helper, other) => {
        if (other === cauldron) {
          const name = `some ${this.name}`;
          if (!other.items[name.toLowerCase()]) {
            return other.addItem(new Item(name)); // Add copy to cauldron
          }
        } else {
          this.container.removeItem(this);
          return other.addItem(this);
        }
      },
      (helper, other) =>
        `You put some ${this.name} ${other.preposition} the ${other.name}.`
    ];
  }
}
