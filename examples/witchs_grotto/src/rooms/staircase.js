import { Room, Item, RandomText, Verb, getRoom, addKeyword } from "../../../../lib/gonorth";
import { bedroom } from "./bedroom";

const defaultDescriptions = new RandomText(
  "Left, then right, then left, then right. You keep walking, your leg muscles burning, but there's no end to the stairs in sight.",
  "Sometimes you think you can hear someone's footsteps on the stairs, but when you stop and listen, all is silent. Then, when you resume your slow climb you hear them again. Is it just your own footfalls somehow echoing back at you? Or is someone creeping up the stairs behind you, always just out of sight round the bend?",
  "You decide to try running. Maybe that will help you reach the top faster. You run and run, your feet thundering on the wooden steps. Before long, though, you're forced to stop, pulling air in and out of your lungs in panting wheezes.",
  "Is it just your imagination, or has it got even darker? You can barely see where you're placing your feet. Still, you keep on going.",
  "As you climb, you wonder how you'd have missed something this tall in the forest. You feel as though you must be up in the clouds by now."
);

let facingBackwards = false;

export const staircase = new Room(
  "Staircase",
  () => {
    facingBackwards = false;
    staircase.setUp(staircase, true, null, null, false);
    staircase.stage++;

    switch (staircase.stage) {
      case 1:
        return "You begin climbing the long, narrow staircase, the walls looming oppressively close to either side of you. The deep shadows in front of you gradually yield as you step into them, revealing step after step after step. After a short while the stairs start to curl round to the right and you soon lose sight of the bottom.\n\nYou only really have two choices - continue upwards or go back down.";
      case 2: {
        if (!staircase.items[symbols.name.toLowerCase()]) {
          staircase.addItem(symbols);
        }
        return "You continue trudging upwards, the stairs spiralling round always to the right. The shadows and the walls continue to be oppressive, never quite reaching pitch blackness, but never diminishing either. The only discernible change is that the steps have gone from stone to wooden. On the walls you can just make out some strange symbols, but those have always been present, you realise.\n\nUp or down - which will it be?";
      }
      case 3:
        return "You keep expecting to see a landing, but one never arrives. The narrow staircase continues curling around to the right, marching ever upwards. You can see six or seven steps in front of you before they disappear out of sight around the bend, and about the same number behind you. \n\nPerseverance, that's what's needed.";
      case 4: {
        if (!staircase.items[writing.name.toLowerCase()]) {
          staircase.addItem(writing);
        }
        return "The monotony of the never-ending steps is just beginning to get to you when something catches your eye. Scrawled across the wall is what looks like some kind of graffiti.";
      }
      default:
        return defaultDescriptions;
    }
  },
  true
);

const steps = new Item("stone steps", () => {
  let description = "Due to the spiral nature of the staircase, the individual steps are each segment shaped.";
  if (staircase.stage < 2) {
    return "Plain stone steps with no particular adornment. " + description;
  } else {
    return (
      "The steps are wooden, creaky, and very old looking. Any varnish that might once have been on them has long since worn off. " +
      description
    );
  }
});
steps.aliases = ["stairs", "step", "stair"]

const symbols = new Item(
  "symbols",
  "Swirls and loops and arcane figures - there's something otherworldly about these markings, as though they weren't written by an Earthly intelligence. You can't tell what was used to make them. They look completely smooth and somehow almost seem to glow in the dim light. They give you the creeps."
);
symbols.aliases = ["symbol", "swirl", "swirls"];

const writing = new Item(
  "graffiti",
  'On closer inspection, it\'s not so much graffiti as it is a message. It\'s written in a slightly shaky script, in what looks like chalk. The words read:\n\n"YOU MAY GO NO FURTHER FORWARD. TURN AROUND."'
);
writing.aliases = ["writing", "message"];

const turnAround = new Verb(
  "turn around",
  () => true,
  () => {
    if (getRoom().name === "Staircase") {
      facingBackwards = !facingBackwards;

      if (facingBackwards) {
        staircase.setUp(
          bedroom,
          true,
          [
            "You carefully lift your left foot and place it on the step above the one you\'re on, all whilst continuing to look backwards down the stairs. Then, you transfer your weight to your left leg and carefully repeat the process with your right foot, lifting it onto the next step behind you. One by one, you reverse your way up the steps. After the tenth step you lift your foot to find the eleventh and nearly fall over when your foot finds nothing but air. Instead, it comes down hard on...carpet? You take an excited peek over your shoulder - there are no more stairs! You've reached the top at last.",
            () => (staircase.stage = 0)
          ],
          null,
        false);
      } else {
        staircase.setUp(staircase, true, null, null, false);
      }

      return `You turn around to face the other way. You're now looking ${facingBackwards ? "down" : "up"} the stairs.`;
    } else {
      return "You turn slowly around but don't see anything new.";
    }
  },
  null,
  ["turn back", "about turn", "about face"],
  true);
turnAround.doNotList = true;

addKeyword(turnAround);

// Tracker to determine how many times the player has attempted to ascend.
staircase.stage = 0;

if (!staircase.items[steps.name.toLowerCase()]) {
  staircase.addItem(steps);
}

staircase.setUp(staircase, true, null, null, false);
