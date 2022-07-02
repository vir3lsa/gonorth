import { Item, Verb, selectPlayer, getItem, moveItem, ConcatText } from "../../../../lib/gonorth";
import { getAlchemy, getCauldron } from "./cauldron";
import { getPestleAndMortar } from "./pestleAndMortar";

export function newIngredient(config) {
  const { name, description, holdable, size, ...remainingConfig } = config;
  const item = new Ingredient(name, description, holdable, size);
  Object.entries(remainingConfig).forEach(([key, value]) => (item[key] = value));

  return item;
}

export class Ingredient extends Item {
  clone() {
    const clone = super.clone(Ingredient);
    clone.spirit = this.spirit;
    clone.aura = this.aura;
    return clone;
  }

  constructor(name, description, holdable = true, size = 1) {
    super(name, description, holdable, size);
    this.article = "";
    this.aura = "neutral";

    if (holdable) {
      this.verbs.put.onSuccess = [
        ({ item, other }) => {
          if (other === getCauldron()) {
            const name = `some ${item.name}`;
            let someIngredient = getItem(name.toLowerCase());

            if (!someIngredient) {
              someIngredient = new Ingredient.Builder().withName(name).isHoldable(false).isDoNotList(true).build();
              return other.addItem(someIngredient); // Add copy to cauldron
            } else if (!other.items[name.toLowerCase()]) {
              return moveItem(someIngredient, other); // Move copy to cauldron
            }
          } else {
            item.container.removeItem(item);
            return other.addItem(item);
          }
        },
        ({ item, other }) => {
          const article = item.spirit ? "the" : item.article.length ? item.article : "some";
          const text = `You put ${article} ${item.name} ${other.preposition} the ${other.name}.`;

          if (other === getCauldron()) {
            const alchemyText = getAlchemy().addIngredient(item);
            return new ConcatText(text, alchemyText); // Concatenate the texts.
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
    }

    this.addAliases("ingredient");
  }

  static get Builder() {
    return IngredientBuilder;
  }
}

class IngredientBuilder extends Item.Builder {
  constructor(name) {
    super(name);
  }

  withSpirit(spirit) {
    this.config.spirit = spirit;
    return this;
  }

  withAura(aura) {
    this.config.aura = aura;
    return this;
  }

  build() {
    return newIngredient(this.config);
  }
}
