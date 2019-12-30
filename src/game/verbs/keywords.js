import { Verb, GoVerb } from "./verb";
import { selectInventory } from "../../utils/selectors";
import { RandomText } from "../interactions/text";

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
  const inventoryVerb = new Verb(
    "inventory",
    true,
    () => {
      const inventory = selectInventory();
      const { items } = inventory;

      if (!Object.keys(items).length) {
        return "You're not holding anything.";
      }

      return `You're carrying ${inventory.basicItemList}.`;
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

  const wait = new Verb(
    "wait",
    true,
    new RandomText(
      "You pause for a moment, taking stock of the situation.",
      "You look around you and drink in your surroundings, letting the moment linger.",
      "You stop and think. Yes, you're sure there's a way out of this mess."
    ),
    [],
    [],
    true
  );

  addKeyword(inventoryVerb);
  addKeyword(north);
  addKeyword(south);
  addKeyword(east);
  addKeyword(west);
  addKeyword(up);
  addKeyword(down);
  addKeyword(wait);
}

export function addKeyword(keyword) {
  keywords[keyword.name] = keyword;
}

export function getKeyword(name) {
  return keywords[name];
}
