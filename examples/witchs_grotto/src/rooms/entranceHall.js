import { Room, Item } from "../../../../lib/gonorth";
import { southHall } from "./southHall";
import { garden } from "./garden";

export const entranceHall = new Room(
  "Entrance Hall",
  "This is plainly the grotto's entrance hall. Several circular windows allow light to stream in, glinting on the dust motes hanging heavily in the air. A large pair of oak double doors with a huge iron lock is set into the North wall and clearly serves as the main entrance. A moth-eaten but still rather beautiful rug lies in front of the doors, atop the dark floor boards. To one side of the door is a dead-looking tree limb that appears to function as a coat and hat stand. The witch's shaul isn't on it, but there's a black hat hanging on one of the branches. Against the wall opposite the door there's a beautiful mahogany sideboard.\n\nTo the South there's an archway leading to another corridor, whilst to the West is a sturdy door."
);

const slip = new Item(
  "slip of paper",
  'It\'s a small piece of lined paper, evidently torn from a notebook. On it is scribbled the heading "Charm of the Beast" followed by a series of words that you hastily commit to memory.',
  true,
  0.5
);
slip.aliases = ["slip", "paper", "page"];

const sideboard = new Item(
  "sideboard",
  "Finished in a low-gloss lacquer, and with brass tear-drop handles, it's a beautiful old antique."
);
sideboard.aliases = "mahogany";
sideboard.hidesItems = slip;
sideboard.preposition = "on";
sideboard.capacity = 5;

entranceHall.addItems(sideboard);
entranceHall.setSouth(southHall);
entranceHall.setNorth(garden);
