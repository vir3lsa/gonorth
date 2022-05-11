import { Room, Item, selectInventory } from "../../../../lib/gonorth";
import { initSnug } from "./snug";

let diningRoom;

export const getDiningRoom = () => {
  return diningRoom;
};

export const initDiningRoom = () => {
  diningRoom = new Room(
    "Dining Room",
    "The room is long and thin and is dominated by a large, if plain, table, marking this out as the dining room. Several candles flicker gently at evenly-spaced intervals along the table. Three places have been set with plates, cutlery and large wine goblets. Is the witch expecting guests?\n\nDown one wall is a long wooden cabinet, and various pictures adorn the walls.\n\nAt the rear of the room, a bead curtain with a moon and stars motif leads Westwards, and an archway opens onto the kitchen to the East.",
    true
  );

  const table = new Item(
    "table",
    "It's extremely grand given the relative modestness of the rest of the grotto. It's easily large enough to seat ten people, but places are currently set for three - the head of the table at one end and the two places to either side. Elegant silver cutlery has been laid out, along with fine china plates and crystal wine goblets."
  );

  const fruit = new Item(
    "fruit",
    "It looks fresh and delicious. The bright colours are made to look even more vibrant by the beads of condensation glistening on the skins.",
    true,
    1
  );
  fruit.containerListing =
    "In the middle of the table is a large assortment of fruit. All shapes, sizes and colours, there are varieties here you don't even know the names of.";

  fruit.verbs["take"].onSuccess = [
    () => {
      if (!selectInventory().items["piece of fruit"]) {
        selectInventory().addItem(
          new Item(
            "piece of fruit",
            "It's mouth-wateringly delicious. Except...when you take a closer look, you realise it doesn't look delicious at all. In fact, it's soft, brown and rotten. Little pits in the surface make you fairly sure it's full of maggots too. Disgusting.",
            true,
            1
          )
        );
      }
    },
    "You lean across the huge table and select a particularly juicy looking piece of fresh fruit."
  ];

  table.aliases = "dining table";
  table.itemsVisibleFromRoom = true;
  table.capacity = 20;
  table.preposition = "on";
  table.addItem(fruit);

  const crossStitch = new Item(
    "cross-stitch",
    `It looks home-made, but you can hardly imagine the witch, terrible as she is, sitting down with needle and thread and producing such a jolly piece. It depicts a menagerie of animals, as well as the words:

| Dolittle Decoction                                 |
|:--------------------------------------------------:|
| ***                                                |
| Start by concocting the Essence of Moon.           |
| Add devil's claw and some worm-eaten fruit.        |
| Apply heat and stir until a mirrored surface forms.|
| Add crushed crow skull powder and stir in fully.   |
| Intone the Beastly Incantation.                    |`,
    true
  );
  crossStitch.aliases = ["cross"];

  const pictures = new Item(
    "pictures",
    () =>
      `There's a disturbing oil painting depicting a stern-looking woman standing over a child who's fallen in the mud${
        diningRoom.items[crossStitch.name.toLowerCase()] ? ", and an incongruously cheery cross-stitch" : ""
      }. The others don't particularly catch your eye.`
  );
  pictures.aliases = ["paintings", "pics"];
  pictures.hidesItems = crossStitch;
  diningRoom.addItems(pictures, table);

  const beadCurtain = new Item(
    "bead curtain",
    "Strands of beads make a sort of curtain-cum-doorway. They're mostly a dark midnight blue except for the ones depicting a classical crescent moon and more unusual seven-pointed stars, which gleam with a milky yellow hue."
  );
  beadCurtain.aliases = ["curtain", "beads", "moon and stars", "moon", "stars"];

  diningRoom.addItem(beadCurtain);

  const snug = initSnug();
  snug.addItem(beadCurtain);

  diningRoom.setWest(
    snug,
    true,
    "Parting the bead strands with your hands, you split the image of the moon in two and pass through, causing the beads to rattle gently."
  );

  return diningRoom;
};
