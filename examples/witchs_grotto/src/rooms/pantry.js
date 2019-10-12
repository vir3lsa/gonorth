import { Room } from "../../../../lib/gonorth";
import { southHall } from "./southHall";

export const pantry = new Room(
  "Pantry",
  `Set further back into the hillside, there are no windows in here and the only light comes from a dim yellow electric bulb that buzzes gently as it casts its glow over the room. Shelves line the walls, stacked with tins, bottles and opened food packets. There's a large wooden crate under the shelves on the West of the room.

You see a rickety door to the North and a white painted door leading East.`
);

pantry.setEast(southHall);
