import {
  Room,
  newDoor,
  Item,
  Verb,
  retrieve,
  CyclicText,
  RandomText,
  SequentialText,
  store
} from "../../../../lib/gonorth";
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
    "You find yourself in a long corridor with pretensions of grandeur. There's a worn and dusty red rug lining much of its length and a large grandfather clock stands in one corner, balefully ticking off the seconds as they pass. There are no windows, but several candles in ornate wall sconces cast a flickering yellow light. The ceiling is some way above you, lost in shadow. You get the queasy feeling something's up there, staring down at you from its hiding place in the dark.\n\nOpposite the clock is a full suit of armour, looking eerily like it could spring to life at any moment.\n\nThere are four ways leading out of here. To the north is an archway leading to the main hall. On the West wall there's a white painted door, whilst to the East there's an impossibly long and narrow staircase leading upwards into inky shadows. There's a rickety wooden door to the South."
  );

  const clockwise = new Item.Builder().withName("clockwise").build();
  const anticlockwise = new Item.Builder()
    .withName("anticlockwise")
    .withAliases("anti", "anti clockwise", "counterclockwise", "counter", "counter clockwise")
    .build();
  anticlockwise.removeAliases("clockwise", "clock wise", "clock");

  const amountText = new RandomText(
    " a quarter turn.",
    " through ninety degrees.",
    ".",
    (direction) => ` a quarter of a turn ${direction}.`,
    (direction) => ` ninety degrees ${direction}.`,
    (direction) => ` ${direction}.`
  );

  const turnHalberdText = new RandomText(
    (direction) =>
      `Gripping the spear shaft with both hands, you turn it slowly but surely${amountText.next(direction)}`,
    (direction) => `You twist the weapon around in the figure's hand${amountText.next(direction)}`,
    (direction) => `Carefully and deliberately, you rotate the heavy weapon${amountText.next(direction)}`
  );

  const armourPuzzleFail = new CyclicText(
    "A clang and a whirring of gears suggests something went wrong.",
    "The weapon becomes more difficult to turn, then something clunks back into place.",
    "Some clanking and rumbling indicates a mechanism resetting."
  );

  const armourPuzzleSolution = [
    { direction: anticlockwise, until: -0.75 },
    { direction: clockwise, until: -0.25 },
    { direction: anticlockwise, until: -1.25 },
    { direction: clockwise, until: -1 }
  ];

  let rotation = 0;
  let stage = 0;

  const turnHalberd = (direction) => {
    const expected = armourPuzzleSolution[stage];

    if (direction !== expected.direction) {
      rotation = 0;
      stage = 0;
      return armourPuzzleFail;
    }

    if (direction === clockwise) {
      rotation += 0.25;
    } else {
      rotation -= 0.25;
    }

    if (rotation === expected.until) {
      if (stage < armourPuzzleSolution.length - 1) {
        stage++;
      } else {
        store("armourPuzzleSolved", true);
        rotation = 0;
        stage = 0;
        return new SequentialText(
          "After giving the halberd one final twist, it locks securely in place and a whirring and grinding of gears emanates from inside the metal shell of the armour's chest plate.",
          "With a sudden *snap*, the helmet's visor slides up, revealing an opening over what would be the wearer's face, were anyone inside."
        );
      }
    }

    return turnHalberdText.next(direction.name);
  };

  const armour = new Item.Builder()
    .withName("suit of armour")
    .withAliases("breast plate", "grieves", "cuirass", "knight")
    .withDescription(
      "It's a full metal suit of armour, standing against the wall. From head to toe, every part of a person's body is accounted for in iron. Someone could very easily be inside, keeping still, waiting to grab you when you get close.\n\nA vicious-looking halberd is clutched in the figure's right gauntlet."
    )
    .hidesItems(
      new Item.Builder()
        .withName("halberd")
        .withAliases("axe", "ax", "spear", "weapon")
        .withDescription(
          "It's taller than the suit of armour by a foot or so. Its heavy axe head is the shape of a crescent moon - its spear point an upward-pointing arrow."
        )
        .withVerbs(
          new Verb.Builder()
            .withName("take")
            .withAliases("pick up", "steal", "grab", "hold")
            .withTest(false)
            .withOnFailure(
              "The gauntleted hand is gripped tightly around the shaft of the weapon, making taking it impossible. It does seem possible to rotate it, though."
            )
            .build(),
          new Verb.Builder()
            .withName("rotate")
            .withAliases("spin", "turn")
            .makePrepositional("which way")
            .withTest(
              ({ other: direction }) =>
                !retrieve("armourPuzzleSolved") && (direction === clockwise || direction === anticlockwise)
            )
            .withOnSuccess(({ other: direction }) => turnHalberd(direction))
            .withOnFailure(({ other: direction }) => {
              if (direction === clockwise || direction === anticlockwise) {
                return "Having already activated the armour's hidden mechanism, you can no longer turn the shaft - it's locked tightly in place.";
              } else {
                return "The halberd will only rotate clockwise or anticlockwise.";
              }
            })
            .build()
        )
        .build()
    )
    .build();

  const ricketyDoor = newDoor({
    name: "rotten door",
    description:
      "A rickety-looking wooden door consisting of barely held-together rotten planks. One hinge is missing; the others appear to be in working order.",
    open: false,
    locked: false,
    aliases: ["rickety", "planks"]
  });

  const upperSpiral = initUpperSpiral();
  southHall.addItems(clockwise, anticlockwise, armour, ricketyDoor);
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
