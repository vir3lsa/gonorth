import { Room, goToRoom, Option } from "../../../../lib/gonorth";
import { apothecary } from "./apothecary";

export const flue = new Room(
  "flue",
  "Behind the coal compartment the flue continues downwards as though it's connected to another room below. There's a bend in the pipe so you can't see what's down there."
);

let insideOven;

flue.options = [
  new Option("Slide down", [
    "Squeezing your eyes shut and hoping for the best, you cross your arms over your chest and slide down the steep, slippery pipe as if it were a playground ride.",
    "Air rushes past you as you plummet into the darkness. The pipe twists and turns as it descends ever further, first throwing you left, then slamming you to the right. If you weren't in mortal peril, this might be quite fun.",
    "Abruptly the pipe comes to and end and you find yourself deposited unceremoniously in a large black couldron sitting in a huge fireplace. Luckily, the couldron is empty (apart from you) and the fire isn't lit. You clamber carefully out, trying not to bump any of the new bruises you acquired on the way down the flue and look around you.",
    () => goToRoom(apothecary)
  ]),
  new Option(
    "Climb up",
    "You attempt to climb the flue but you can't get any purchase on the slippery metal walls. Even if you could make it into the chimney, it would be too wide to shimmy up it."
  ),
  new Option("Retreat", [
    "You decide not to risk it and retreat backwards into the main oven compartment.",
    () => goToRoom(insideOven)
  ])
];

// Do this to avoid circular dependencies
export const setInsideOven = room => (insideOven = room);
