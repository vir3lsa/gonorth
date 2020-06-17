import { Room, Item, RandomText } from "../../../../lib/gonorth";

const defaultDescriptions = new RandomText(
  "Left, then right, then left, then right. You keep walking, your leg muscles burning, but there's no end to the stairs in sight.",
  "Sometimes you think you can hear someone's footsteps on the stairs, but when you stop and listen, all is silent. Then, when you resume your slow climb you hear them again. Is it just your own footfalls somehow echoing back at you? Or is someone creeping up the stairs behind you, always just out of sight round the bend?",
  "You decide to try running. Maybe that will help you reach the top faster. You run and run, your feet thundering on the wooden steps. Before long, though, you're forced to stop, pulling air in and out of your lungs in panting wheezes."
);

export const staircase = new Room("Staircase", () => {
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
});

const symbols = new Item(
  "symbols",
  "Swirls and loops and arcane figures - there's something otherworldly about these markings, as though they weren't written by an Earthly intelligence. You can't tell what was used to make them. They look completely smooth and somehow almost seem to glow in the dim light. They give you the creeps."
);
symbols.aliases = ["swirls"];

const writing = new Item(
  "graffiti",
  'It\'s written in a slightly shaky script, in what looks like chalk. The words read:\n\n"TURN BACK"'
);
writing.aliases = ["writing"];

// Tracker to determine how many times the player has attempted to ascend.
staircase.stage = 0;

staircase.setUp(staircase, true, null, null, false);
