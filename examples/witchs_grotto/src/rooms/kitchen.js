import { Room } from "../../../../lib/gonorth";
import { diningRoom } from "./diningRoom";
import { pantry } from "./pantry";
import { entranceHall } from "./entranceHall";

export const kitchen = new Room(
  "Kitchen",
  `The witch's kitchen would look homely and cozy if not for the layers of grime coating nearly every surface and the various large and evil looking knives hanging on the wall. In one corner is the most enormous oven you've ever laid eyes on, heat rippling off it in waves. A dusty book lies on a sturdy, round, wooden table.
  
An archway leads West, a rickety door barely hangs on its hinges to the South and a sturdier looking door leads East.`
);

kitchen.setWest(diningRoom);
kitchen.setSouth(pantry);
kitchen.setEast(entranceHall);
