import { Item, Verb, selectPlayer } from "../../../../lib/gonorth";
import { getAlchemy, getCauldron } from "./cauldron";
import { getPestleAndMortar } from "./pestleAndMortar";

export class Ingredient extends Item {
  constructor(name, description) {
    super(name, description, true, 1);
    this.article = "";
    this.verbs.put.onSuccess = [
      ({ item, other }) => {
        if (other === getCauldron()) {
          const name = `some ${item.name}`;
          if (!other.items[name.toLowerCase()]) {
            const someIngredient = new Ingredient(name);
            someIngredient.doNotList = true;
            someIngredient.holdable = false;
            return other.addItem(someIngredient); // Add copy to cauldron
          }
        } else {
          item.container.removeItem(item);
          return other.addItem(item);
        }
      },
      ({ item, other }) => {
        const text = `You put ${item.article.length ? item.article : "some"} ${item.name} ${other.preposition} the ${
          other.name
        }.`;

        if (other === getCauldron()) {
          const alchemyText = getAlchemy().addIngredient(item);
          return [text, alchemyText]; // Array components will be concatenated
        }

        return text;
      }
    ];
    this.verbs.put.addAliases("add");

    const grind = new Verb(
      "grind",
      ({ item, other }) => !item.powdered && other === getPestleAndMortar(),
      [
        ({ item }) => {
          const name = `${item.name} powder`;
          if (!selectPlayer().items[name.toLowerCase()]) {
            const powder = new Ingredient(name, `A sample of ${item.name} that has been ground to a fine dust.`);
            powder.powdered = true;
            return selectPlayer().addItem(powder);
          }
        },
        ({ item }) =>
          `You carefully crush some of the ${item.name} with the rough stone implements, grinding it down until it forms a fine powder.`
      ],
      ({ item, other }) => {
        if (item.powdered) {
          return `The ${item.name} is already powdered. There's no point in grinding it further.`;
        }
        return `The ${other.name} won't make a very good grinder, unfortunately.`;
      }
    );
    grind.makePrepositional("with what");
    grind.addAliases("crush");
    this.addVerb(grind);
    this.addAliases("ingredient");
  }
}
