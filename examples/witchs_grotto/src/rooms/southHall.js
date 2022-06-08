import {
  Room,
  newDoor,
  Item,
  Verb,
  retrieve,
  CyclicText,
  RandomText,
  SequentialText,
  ConcatText,
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
    .withAliases("anti", "anti clockwise", "counterclockwise", "counter", "counter clockwise", "anticlock")
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
    { direction: anticlockwise, until: 6 },
    { direction: clockwise, until: 9 },
    { direction: anticlockwise, until: 12 },
    { direction: clockwise, until: 6 }
  ];

  let trackedSequences = [];

  const turnHalberd = (direction) => {
    if (direction === armourPuzzleSolution[0].direction) {
      // The direction matches the start of the solution sequence, so track a new possible sequence.
      trackedSequences.push({ halberdRotation: 0, halberdStage: 0 });
    }

    trackedSequences.forEach((sequence) => {
      const expected = armourPuzzleSolution[sequence.halberdStage];

      if (direction !== expected.direction) {
        sequence.failed = true;
        return;
      }

      if (direction === clockwise) {
        sequence.halberdRotation += 3;
      } else {
        sequence.halberdRotation -= 3;
      }

      if (sequence.halberdRotation > 12) {
        sequence.halberdRotation -= 12;
      } else if (sequence.halberdRotation < 1) {
        sequence.halberdRotation += 12;
      }

      if (sequence.halberdRotation === expected.until) {
        if (sequence.halberdStage < armourPuzzleSolution.length - 1) {
          sequence.halberdStage++;
        } else {
          store("armourPuzzleSolved", true);
          sequence.solved = true;
        }
      }
    });

    // Stop tracking failed sequences.
    trackedSequences = trackedSequences.filter((sequence) => !sequence.failed);

    if (trackedSequences.some((sequence) => sequence.solved)) {
      // Puzzle is solved - return success text.
      return new SequentialText(
        "After giving the halberd one final twist, it locks securely in place and a whirring and grinding of gears emanates from inside the metal shell of the armour's chest plate.",
        "With a sudden *snap*, the helmet's visor slides up, revealing an opening over what would be the wearer's face, were anyone inside."
      );
    } else {
      // Puzzle isn't yet solved - return standard text.
      return turnHalberdText.next(direction.name);
    }
  };

  const handWontMove = new RandomText(
    "The hand won't turn in that direction.",
    "It doesn't want to budge.",
    "It's stuck.",
    (direction) => `You can't seem to turn it ${direction}.`,
    (direction) => `It won't turn ${direction} right now.`
  );

  const nervousText = new RandomText(
    " You glance around nervously. Surely the witch heard that?",
    "",
    " You wince fearfully. This is making a lot of noise.",
    "",
    " You look from the doors, to the stairs, to the archway to the North, sure that the witch will appear at any moment."
  );

  const handStageCompleteText = new RandomText(
    () => `A loud *bong* emanates from inside the clock, reverberating down the hallway.${nervousText.next()}`,
    () => `The clock chimes loudly, as if marking the hour.${nervousText.next()}`,
    () => `The grandfather clock *bongs* resonantly, making you jump.${nervousText.next()}`
  );

  let handPosition = 12;
  let handStage = 0;

  const handAmountText = new RandomText(
    " a quarter turn.",
    ".",
    () => ` to ${handPosition} o'clock.`,
    (direction) => ` a quarter of a turn ${direction}.`,
    (direction) => ` ${direction}.`,
    (direction) => ` ${direction} to ${handPosition} o'clock.`
  );

  const turnHandText = new RandomText(
    (direction) => `Reaching up on tiptoes, you push the hand with your finger${handAmountText.next(direction)}`,
    (direction) =>
      `There's a mechanical whirring from inside the clock as the hand turns${handAmountText.next(direction)}`,
    "The filigreed metal is sturdy and cold to the touch, but moves easily."
  );

  const turnHand = (direction) => {
    const expected = armourPuzzleSolution[handStage];

    if (direction !== expected.direction) {
      return handWontMove.next(direction.name);
    }

    if (direction === clockwise) {
      handPosition += 3;
    } else {
      handPosition -= 3;
    }

    if (handPosition > 12) {
      handPosition -= 12;
    } else if (handPosition < 1) {
      handPosition += 12;
    }

    if (handPosition === expected.until) {
      if (handStage < armourPuzzleSolution.length - 1) {
        handStage++;
        return new ConcatText(turnHandText.next(direction.name), handStageCompleteText);
      } else {
        handPosition = 12;
        handStage = 0;
        return new SequentialText(
          "Without warning, a door above the clock face flies open and a pair of figures emerge. Accomponying this is a cacophony of *bongs* and chimes and the whirring of gears.",
          "One of the figures lowers its head - it's covered by a bag, you realise - to a chopping block, whilst the other jerkily swings an axe towards it. An execution - how charming.",
          "Once the scene is over, the din mercifully stops and the figures retreat to the innards of the clock. The hour hand winds itself back to the 12 o'clock position.",
          "You wonder whether to hide. Every bird in the woods must have taken flight from the noise the clock just made."
        );
      }
    }

    return turnHandText.next(direction.name);
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

  const clock = new Item.Builder()
    .withName("grandfather clock")
    .withDescription(
      "Easily twice your height, the regal old grandfather clock is as old as it is charming. Its sturdy walnut construction lends a deep, somewhat ominous resonance to the steady ticking of its clockwork. The clock face itself is pale, with Roman numerals denoting the hours. There's just a single hand - the hour hand. Whether the others were removed at some point in the distant past, or if they were never part of the clock, you can't tell. The hand is uncovered, meaning you could reach up and touch it if you desired."
    )
    .hidesItems(
      new Item.Builder("hour hand")
        .withDescription(
          () =>
            `The single hand is wrought in delicately filigreed black metal. It's just within your reach.\n\nIt's pointing to ${handPosition} o'clock.`
        )
        .withVerbs(
          new Verb.Builder()
            .withName("take")
            .withAliases("pick up", "steal", "grab", "hold")
            .withTest(false)
            .withOnFailure("The hand's attached to the clock - you can't take it.")
            .build(),
          new Verb.Builder("turn")
            .withAliases("rotate", "wind", "spin", "move", "push")
            .makePrepositional("which way")
            .withOnSuccess(({ other: direction }) => turnHand(direction))
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
  southHall.addItems(clockwise, anticlockwise, clock, armour, ricketyDoor);
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
