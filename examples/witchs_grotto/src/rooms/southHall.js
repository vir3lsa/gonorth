import { Room, Door } from "../../../../lib/gonorth";
import { bedroom } from "./bedroom";
import { upperSpiral } from "./upperSpiral";

export const southHall = new Room("South Hall", "placeholder");

const ricketyDoor = new Door(
  "rickety door",
  "A rickety looking wooden door consisting of barely held-together rotten planks. One hinge is missing - the others appear to be in working order.",
  false,
  false
);

southHall.addItems(ricketyDoor);
upperSpiral.addItems(ricketyDoor);

southHall.setEast(bedroom);
southHall.setSouth(
  upperSpiral,
  () => ricketyDoor.open,
  "You step through the doorway.",
  "Rickety as it may be, it's still a door, and it's still closed. Much as you'd like to, you can't simply pass through it."
);
