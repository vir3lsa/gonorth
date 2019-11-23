import { Verb } from "./verb";
import { selectInventory } from "../utils/selectors";
import { Npc } from "./npc";

const vowels = ["a", "e", "i", "o", "u"];
let keywords;

export function createKeywords() {
  const inventory = new Verb(
    "inventory",
    true,
    () => {
      const inventory = selectInventory();
      const { items, unique } = inventory;

      if (!Object.keys(items).length) {
        return "You're not holding anything.";
      }

      let text = "You're carrying ";

      unique.forEach((name, i) => {
        let article = items[name] instanceof Npc ? "" : "a";

        if (article.length && vowels.includes(name.substring(0, 1))) {
          article += "n";
        }

        text += `${article} ${name}`;

        if (i < unique.length - 2) {
          text += ", ";
        } else if (i < unique.length - 1) {
          text += " and ";
        } else {
          text += ".";
        }
      });

      return text;
    },
    null,
    ["i", "holding", "carrying"],
    true
  );

  keywords = {};
  keywords["inventory"] = inventory;
}

export function getKeyword(name) {
  return keywords[name];
}
