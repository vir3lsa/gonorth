import { Room, Item, Verb, goToRoom } from "../../../../lib/gonorth";
import { diningRoom } from "./diningRoom";
import { pantry } from "./pantry";
import { entranceHall } from "./entranceHall";
import door from "../../../../lib/game/door";
import { insideOven } from "./insideOven";

export const kitchen = new Room(
  "Kitchen",
  `The witch's kitchen would look homely and cosy if not for the layers of grime coating nearly every surface and the various large and evil looking knives hanging on the wall. In one corner is the most enormous oven you've ever laid eyes on, looming over you imposingly. In the middle of the room is a round, wooden table.
  
An archway leads West, a rickety door barely hangs on its hinges to the South and a sturdier looking door leads East.`
);

const cookBook = new Item(
  "cook book",
  "The front cover reads *Cooking with Children - A Complete Guide*.",
  true,
  2
);
cookBook.aliases = ["book", "cook book", "tome"];
cookBook.roomListing = "A dusty book lies open on the table.";

const oven = new Item(
  "oven",
  "It's massive and black and appears dormant at present. There's a large, windowless door in the front. The top of the oven is a long way above you - you couldn't see the hob even if you stood on a chair."
);
oven.aliases = ["cooker", "stove"];

const ovenDoor = new door(
  "oven door",
  "Like the rest of the oven, the door is charcoal black and appears to be made of solid iron.",
  false,
  false,
  "You yank the handle and the door swings open with a clang."
);

const crawl = new Verb(
  "crawl inside",
  () => ovenDoor.open,
  [
    "You drop to all fours and crawl inside the open oven head first.",
    "Just as you pull your feet in behind you, you hear a noise from the kitchen. As you begin to turn around there's a bone-chilling cackle and the oven door slams shut, trapping you inside.",
    "There's a squeal as another door in the oven that you hadn't noticed is opened. It must be in a chamber below you. There's a noise like sandpaper being rubbed against something and within seconds the cloying aroma of coal smoke tickles your nostrils.",
    "The witch must have lit the fire in the compartment at the bottom of the oven.",
    () => goToRoom(insideOven)
  ],
  "The oven door's closed.",
  ["crawl", "enter", "go into", "hide"]
);

oven.addVerb(crawl);

kitchen.addItem(cookBook);
kitchen.addItem(oven);
kitchen.addItem(ovenDoor);

kitchen.setWest(diningRoom);
kitchen.setSouth(pantry);
kitchen.setEast(entranceHall);
