import {
  Room,
  Door,
  Item,
  Verb,
  OptionGraph,
  RandomText,
  SequentialText
} from "../../../../lib/gonorth";
import { southHall } from "./southHall";
import { witch } from "./garden";

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

const cupboardGraphRaw = {
  id: "cupboard",
  actions: new SequentialText(
    "There's a small step up as you climb into the cupboard.",
    "A cobweb attaches to your face as you climb inside, but you ignore it and pull the door shut behind you. It's dark and dusty in here and there's an assortment of items on the floor under an old dust sheet that you try to avoid falling over. There's just enough of a gap around the edge of the door to peek out into the room beyond."
  ),
  options: {
    Leave: {
      id: "leave",
      actions:
        "You quietly slip out of the cupboard, trying not to let the door squeak."
    },
    Peek: {
      id: "peek",
      actions: () => {
        const noone =
          "You put your eye to the crack at the side of the door. There doesn't appear to be anyone out there.";
        const watchOut = new RandomText(
          "You peer furtively round the side of the door and quickly recoil. The witch is in the room. You hold your breath."
        );
        return witch.container.name === "Pantry" ? watchOut : noone;
      }
    },
    Wait: {
      id: "wait",
      actions: "You hold your breath and wait, praying no-one finds you here."
    }
  }
};

cupboardGraphRaw.options.Peek.options = cupboardGraphRaw.options;
cupboardGraphRaw.options.Wait.options = cupboardGraphRaw.options;

const cupboardGraph = new OptionGraph(cupboardGraphRaw);

cupboardItem.addVerb(
  new Verb(
    "enter",
    () => cupboardItem.open,
    () => cupboardGraph.commence(),
    "The cupboard isn't open.",
    ["go inside", "go into", "hide"]
  )
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
shelves.capacity = 5;
shelves.preposition = "on";

pantry.addItems(cupboardItem, shelves);
pantry.setEast(southHall);
