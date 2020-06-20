import { Room, Door, Item } from "../../../../lib/gonorth";
import { southHall } from "./southHall";
import { cupboard } from "./cupboard";

export const pantry = new Room(
  "Pantry",
  `Set further back into the hillside, there are no windows in here and the only light comes from a dim yellow electric bulb that buzzes gently as it casts its glow over the room. Shelves line the walls, stacked with tins, bottles and opened food packets. There's a large wooden cupboard against the Southern wall of the room.

You see a rickety door to the North and a white painted door leading East.`
);

const cupboardItem = new Door(
  "cupboard",
  "It's made of solid-looking oak and has a single tall door. It looms over you ominously.",
  false,
  false,
  "You reach up and yank the ornate handle of the cupboard door. There's a small *squeak* as it swings open."
);

const crowSkull = new Item(
  "bird's skull",
  "Pale and elongated, that this once belonged to a bird is in no doubt. The beak is still fully intact and the large eye sockets seem to stare out at you. The whole thing is small enough to fit comfortably in your hand.",
  true
);
crowSkull.aliases = ["skull", "bird skull"];

const shelves = new Item(
  "shelves",
  "You can just about reach the shelves with the help of a chair. There's all manner of stuff up there - most of it useless but not quite everything."
);
shelves.aliases = "shelf";
shelves.hidesItems = crowSkull;
shelves.itemsCanBeSeen = false;
shelves.capacity = 5;
shelves.preposition = "on";

pantry.addItems(cupboardItem, shelves);
pantry.setEast(southHall);
pantry.setSouth(
  cupboard,
  cupboardItem,
  "There's a small step up as you climb into the cupboard.",
  "The cupboard door isn't open."
);
