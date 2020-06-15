import { Room, Item } from "../../../../lib/gonorth";
import { nook } from "./nook";

export const diningRoom = new Room(
  "Dining Room",
  "The room is long and thin and is dominated by a large, if plain, table, marking this out as the dining room. Several candles flicker gently at evenly-spaced intervals along the table. Three places have been set with plates, cutlery and large wine goblets. Is the witch expecting guests?\n\nDown one wall is a long wooden cabinet, and various pictures adorn the walls.\n\nAt the rear of the room, a bead curtain with a moon and stars motif leads Westwards, and an archway opens onto the kitchen to the East."
);

const pictures = new Item(
  "pictures",
  "There's a disturbing oil painting depicting a stern-looking woman standing over a child who's fallen in the mud and an incongruously cheery cross-stitch. The others don't particularly catch your eye."
);

const beadCurtain = new Item(
  "bead curtain",
  "Strands of beads make a sort of curtain-cum-doorway. They're mostly a dark midnight blue except for the ones depicting a classical crescent moon and more unusual seven-pointed stars, which gleam with a milky yellow hue."
);
beadCurtain.aliases = ["curtain", "beads", "moon and stars", "moon", "stars"];

diningRoom.addItem(beadCurtain);
nook.addItem(beadCurtain);

diningRoom.addItem(pictures);

diningRoom.setWest(
  nook,
  true,
  "Parting the bead strands with your hands, you split the image of the moon in two and pass through, causing the beads to rattle gently."
);
