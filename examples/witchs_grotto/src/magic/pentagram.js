import { Item } from "../../../../lib/gonorth";

export const pentagram = new Item(
  "pentagram",
  "A five-pointed star with the topmost point aiming directly at the cauldron. There are spaces just behind each apex where objects may be placed. The design itself appears to have been painted in blood."
);

pentagram.addAliases("five pointed star");
pentagram.capacity = 5;
pentagram.preposition = "on";
