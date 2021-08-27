import { Room } from "../../../../../lib/gonorth";
import { Potion } from "../../magic/alchemy";
import { dolittleDecoction } from "../../magic/dolittleDecoction";
import { cat } from "./cat";

export const snug = new Room(
  "Snug",
  "You find yourself in a cozy snug or cubby. The embers of a fire still glow in a small fireplace and give off a gentle warmth. There's a single large armchair with a black cat curled up in it just in front of the stone hearth. Various leather-bound books are scattered around the room or lie in small piles. There are thick cobwebs in the corners of the room, testament to the witch's aversion to housework.\n\nThe only way out is via the moon and stars bead curtain to the East."
);

snug.addItems(
  cat,
  // TEMP
  dolittleDecoction
  // TEMP
);
