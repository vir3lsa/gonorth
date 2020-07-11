import { Room, Item, Verb, goToRoom, Door } from "../../../../lib/gonorth";
import { diningRoom } from "./diningRoom";
import { pantry } from "./pantry";
import { entranceHall } from "./entranceHall";
import { insideOven } from "./insideOven";
import { Ingredient } from "../magic/ingredient";

export const kitchen = new Room(
  "Kitchen",
  `The witch's kitchen would look homely and cosy if not for the layers of grime coating nearly every surface and the various large and evil looking knives hanging on the wall. In one corner is the most enormous oven you've ever laid eyes on, looming over you imposingly. In the middle of the room is a round, wooden table. There's a cabinet against one wall that looks ready to fall apart.
  
An archway leads West, a rickety door barely hangs on its hinges to the South and a sturdier looking door leads East.`
);

const cookBook = new Item(
  "dusty cook book",
  "The front cover reads *Cooking with Children - A Complete Guide*.",
  true,
  2
);
cookBook.aliases = ["book", "dusty book", "cook book", "tome"];

const cabinet = new Item(
  "cabinet",
  "It's made of grey, dirty wood and comes up to your shoulders. It looks as though it's seen better days, with nails visible between the various panels where it's gradually coming apart. There's a single door taking up most of the front."
);
cabinet.capacity = 8;
cabinet.itemsCanBeSeen = false;

const cabinetDoor = new Door(
  "cabinet door",
  "It's just as decrepit as the rest of the cabinet but still just about in working order.",
  false,
  false,
  "You find purchase on the corner of the door as there's no handle, and pull it open with a creak.",
  null
);

cabinetDoor.verbs["open"].onSuccess.renderNexts = false;
cabinetDoor.verbs["open"].onSuccess.addAction(() => {
  cabinet.itemsCanBeSeen = true;
  cabinet.revealItems();

  const cabinetItemsDescription = cabinet.heldItemsDescription;
  if (cabinetItemsDescription) {
    return cabinet.heldItemsDescription;
  }
});
cabinetDoor.verbs["close"].onSuccess.insertAction(
  () => (cabinet.itemsCanBeSeen = false)
);

cabinet.addVerb(cabinetDoor.verbs["open"]); // "open cabinet" should work
cabinet.addVerb(cabinetDoor.verbs["close"]);

const moonStone = new Ingredient(
  "pearl-like stone",
  "It has a pearlesecent lustre that makes it somehow difficult to focus on. Slight imperfections in its surface resemble craters reminiscent of a full moon."
);
moonStone.article = "a";
moonStone.aliases = ["moon stone", "pearl", "stone"];

cabinet.hidesItems = moonStone;

const table = new Item(
  "table",
  "It's a small round, wooden table with four uneven legs. There's a definite wobble."
);
table.capacity = 10;
table.preposition = "on";
table.addItem(cookBook);

const oven = new Item(
  "oven",
  "It's massive and black and appears dormant at present. There's a large, windowless door in the front. The top of the oven is a long way above you - you couldn't see the hob even if you stood on a chair."
);
oven.aliases = ["cooker", "stove"];

const ovenDoor = new Door(
  "oven door",
  "Like the rest of the oven, the door is charcoal black and appears to be made of solid iron.",
  false,
  false,
  "You yank the handle and the door swings open with a clang.",
  null
);

const crawl = new Verb(
  "crawl inside",
  () => ovenDoor.open,
  [
    "You drop to all fours and crawl inside the open oven head first.",
    "Just as you pull your feet in behind you, you hear a noise from the kitchen. As you begin to turn around there's a bone-chilling cackle and the oven door slams shut, trapping you inside.",
    "There's a squeal as another door in the oven that you hadn't noticed is opened. It must be in a chamber below you. There's a noise like sandpaper being rubbed against something and within seconds the cloying aroma of coal smoke tickles your nostrils.",
    "The witch must have lit the fire in the compartment at the bottom of the oven.",
    () => goToRoom(insideOven),
  ],
  "The oven door's closed.",
  ["crawl", "enter", "go into", "hide"]
);

oven.addVerb(crawl);
oven.addVerb(ovenDoor.verbs["open"]); // Doing 'open oven' should open the oven door
oven.addVerb(ovenDoor.verbs["close"]);

const sturdyDoor = new Door(
  "sturdy door",
  "Remarkably, it appears to be made from a single massive piece of wood. There are scrape marks on the tiles from where it rubs them when it opens.",
  false,
  false,
  "You reach up to the iron handle and give it a good yank. The door barely moves. You pull harder, leaning into it and it slowly but surely opens, making a loud squealing noise. When it's finally open, you let go, panting.",
  null,
  ["sturdy"]
);

kitchen.addItems(table, oven, ovenDoor, sturdyDoor, cabinet, cabinetDoor);

entranceHall.addItem(sturdyDoor);

kitchen.setWest(diningRoom);
kitchen.setSouth(pantry);
kitchen.setEast(
  entranceHall,
  () => sturdyDoor.open,
  "You step through the doorway, noting the impressive thickness of the door and the size of its hinges.",
  "The door is extremely solid and extremely closed."
);
