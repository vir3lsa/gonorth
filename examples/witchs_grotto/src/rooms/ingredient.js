import { Item } from "../../../../lib/gonorth";

export class Ingredient extends Item {
  constructor(name, description, cauldron, alchemy) {
    super(name, description, true, 1);
    this.article = "";
    this.verbs.put.onSuccess = [
      (helper, other) => {
        if (other === cauldron) {
          const name = `some ${this.name}`;
          if (!other.items[name.toLowerCase()]) {
            const someIngredient = new Ingredient(name);
            someIngredient.doNotList = true;
            someIngredient.holdable = false;
            return other.addItem(someIngredient); // Add copy to cauldron
          }
        } else {
          this.container.removeItem(this);
          return other.addItem(this);
        }
      },
      (helper, other) => {
        const text = `You put some ${this.name} ${other.preposition} the ${other.name}.`;

        if (other === cauldron) {
          const alchemyText = alchemy.addIngredient(this);
          return [text, alchemyText]; // Array components will be concatenated
        }

        return text;
      }
    ];
    this.verbs.put.addAliases("add");
  }
}
