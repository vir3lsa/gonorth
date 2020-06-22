import { Item, Verb, selectPlayer } from "../../../../lib/gonorth";
import { alchemy } from "./alchemy";
import { cauldron } from "./cauldron";
import { pestleAndMortar } from "./pestleAndMortar";

export class Ingredient extends Item {
  constructor(name, description) {
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
        const text = `You put some ${this.name} ${other.preposition} the ${
          other.name
        }.`;

        if (other === cauldron) {
          const alchemyText = alchemy.addIngredient(this);
          return [text, alchemyText]; // Array components will be concatenated
        }

        return text;
      }
    ];
    this.verbs.put.addAliases("add");

    const grind = new Verb(
      "grind",
      (_, other) => !this.powdered && other === pestleAndMortar,
      [
        () => {
          const name = `${this.name} powder`;
          if (!selectPlayer().items[name.toLowerCase()]) {
            const powder = new Ingredient(
              name,
              `A sample of ${this.name} that has been ground to a fine dust.`
            );
            powder.powdered = true;
            return selectPlayer().addItem(powder);
          }
        },
        `You carefully crush some of the ${
          this.name
        } with the rough stone implements, grinding it down until it forms a fine powder.`
      ],
      (_, other) => {
        if (this.powdered) {
          return `The ${
            this.name
          } is already powdered. There's no point in grinding it further.`;
        }
        return `The ${
          other.name
        } won't make a very good grinder, unfortunately.`;
      }
    );
    grind.makePrepositional("with what");
    grind.addAliases("crush");
    this.addVerb(grind);
  }
}
