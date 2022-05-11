import { Room, newDoor } from "../../../../lib/gonorth";
import { initBedroom } from "./bedroom";
import { initStaircase } from "./staircase";
import { initUpperSpiral } from "./upperSpiral";

let southHall;

export const getSouthHall = () => {
  return southHall;
};

export const initSouthHall = () => {
  southHall = new Room(
    "South Hall",
    "You find yourself in a long corridor with pretensions of grandeur. There's a worn and dusty red rug lining much of its length and a large grandfather clock stands in one corner, balefully ticking off the seconds as they pass. There are no windows, but several candles in ornate wall sconces cast a flickering yellow light. The ceiling is some way above you, lost in shadow. You get the queasy feeling something's up there, staring down at you from its hiding place in the dark.\n\nThere are four ways leading out of here. To the north is an archway leading to the main hall. On the West wall there's a white painted door, whilst to the East there's an impossibly long and narrow staircase leading upwards into inky shadows. There's a rickety wooden door to the South."
  );

  const ricketyDoor = newDoor({
    name: "rotten door",
    description:
      "A rickety looking wooden door consisting of barely held-together rotten planks. One hinge is missing - the others appear to be in working order.",
    open: false,
    locked: false,
    aliases: ["rickety", "planks"]
  });

  const upperSpiral = initUpperSpiral();
  southHall.addItems(ricketyDoor);
  upperSpiral.addItems(ricketyDoor);

  const staircase = initStaircase();
  southHall.setEast(staircase, true, null, null, false);
  southHall.setUp(staircase, true, null, null, false);

  const descendStairsActions = [
    () => {
      const text =
        "You turn to descend the stairs and, after just a few steps, find yourself back in the Southern hall.";
      if (staircase.stage >= 3) {
        return `${text} What trickery is this?`;
      }
      return text;
    },
    () => (staircase.stage = 0)
  ];

  // Set stairs directions here to avoid circular dependencies
  staircase.setWest(southHall, true, descendStairsActions, null, false);
  staircase.setDown(southHall, true, descendStairsActions, null, false);

  southHall.setSouth(
    upperSpiral,
    () => ricketyDoor.open,
    "You step through the doorway.",
    "Rickety as it may be, it's still a door, and it's still closed. Much as you'd like to, you can't simply pass through it."
  );

  const leaveBedroomText =
    "Turning your back on the bed chamber, you start descending the long spiral staircase. After a single revolution, however, the stairs straighten out and you find yourself back in the Southern hall.";

  const bedroom = initBedroom();
  bedroom.setDown(southHall, true, leaveBedroomText, null, false);
  bedroom.setWest(southHall, true, leaveBedroomText, null, false);

  return southHall;
};
