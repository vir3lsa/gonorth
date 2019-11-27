import { Verb, GoVerb } from "./verb";
import { selectInventory } from "../utils/selectors";
import { Npc } from "./npc";

const vowels = ["a", "e", "i", "o", "u"];
const keywords = {};

export const directionAliases = {
  north: ["n", "forward", "straight on"],
  south: ["s", "back", "backward", "reverse"],
  east: ["e", "right"],
  west: ["w", "left"],
  up: ["u", "upward", "upwards"],
  down: ["d", "downward", "downwards"]
};

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

  const north = new GoVerb("North", directionAliases["north"], true);
  const south = new GoVerb("South", directionAliases["south"], true);
  const east = new GoVerb("East", directionAliases["east"], true);
  const west = new GoVerb("West", directionAliases["west"], true);
  const up = new GoVerb("Up", directionAliases["up"], true);
  const down = new GoVerb("Down", directionAliases["down"], true);

  addKeyword(inventory);
  addKeyword(north);
  addKeyword(south);
  addKeyword(east);
  addKeyword(west);
  addKeyword(up);
  addKeyword(down);
}

export function addKeyword(keyword) {
  keywords[keyword.name] = keyword;
}

export function getKeyword(name) {
  return keywords[name];
}
