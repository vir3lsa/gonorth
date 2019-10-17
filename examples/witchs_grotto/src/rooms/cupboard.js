import { Room, Option } from "../../../../lib/gonorth";

export const cupboard = new Room("Cupboard", "A cobweb attaches to your face as you climb inside, but you ignore it and pull the door shut behind you. It's dark and dusty in here and there's an assortment of items on the floor under an old dust sheet that you try to avoid falling over. There's just enough of a gap around the edge of the door to peek out into the room beyond.");

cupboard.options = [
  new Option("Leave", () => cupboard.go("north")),
  new Option("Peek", "There doesn't appear to be anyone out there."),
  new Option("Wait", "You hold your breath and wait, praying no-one finds you here.")
];
