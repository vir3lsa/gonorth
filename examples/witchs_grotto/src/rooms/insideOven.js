import {
  Room,
  Door,
  Item,
  Verb,
  CyclicText,
  Schedule,
  getRoom,
  TIMEOUT_TURNS,
  TIMEOUT_MILLIS,
  Interaction,
  SequentialText,
  goToRoom
} from "../../../../lib/gonorth";
import { flue, setInsideOven } from "./flue";

export const insideOven = new Room(
  "inside oven",
  "It's dim in here but there's a small amount of light seeping in through a vent high in the door. There's a grille at the back over an opening leading into the flue. There appears to be a large dish of some kind on the shelf above you."
);

let fireBurning = true;
export const hottingUp = new Schedule.Builder()
  .withCondition(() => getRoom() === insideOven)
  .addEvent("It's starting to feel warm under you.")
  .withDelay(2, TIMEOUT_TURNS)
  .addEvent("It's definitely getting hot in here now.")
  .withDelay(3, TIMEOUT_TURNS)
  .addEvent(
    "It's really hot now, like a sauna. You're covered in sweat - it drips from your nose and evaporates on the hot metal."
  )
  .withDelay(3, TIMEOUT_TURNS)
  .addEvent(
    "You need to get out of here. Now. The air is so hot you can feel it burning your face. It's impossible to touch the metal walls and floor of the oven without getting a nasty burn. You're starting to feel faint."
  )
  .withDelay(4, TIMEOUT_TURNS)
  .addEvent(
    "You frantically thrash as your hair starts to smoulder and sores appear on your skin. You take a few more ragged breaths, drawing the burning air into your lungs and then collapse in a fit of coughing and spluttering. Everything goes dark."
  )
  .withDelay(20000, TIMEOUT_MILLIS)
  .build();

const lockedOvenDoor = new Door(
  "oven door",
  new CyclicText(
    "It's dark, solid and very, very thick.",
    "There's a small vent at the top letting in dim shafts of insipid light.",
    "The metallic surface is covered in a thick layer of greasy dirt that sticks to your fingers."
  ),
  false,
  true
);
lockedOvenDoor.aliases = ["door"];

const openDoor = lockedOvenDoor.getVerb("open");
openDoor.onFailure =
  "It seems to be locked somehow. Who on Earth needs a lockable oven, anyway?";

const unlockDoor = lockedOvenDoor.getVerb("unlock");
unlockDoor.test = false;
unlockDoor.onFailure =
  "You can't see the locking mechanism. Must be on the other side.";

lockedOvenDoor.addVerb(
  new Verb(
    "kick",
    false,
    null,
    "You succeed in little more than hurting yourself. The door doesn't budge.",
    ["boot", "shove", "punch", "hit"]
  )
);

const vent = new Item(
  "vent",
  "Five or six narrow slits the width of a coin in the metal of the door let just enough light into the oven's interior for you to see by."
);

const grille = new Item(
  "grille",
  "It's made of thin black metal and has several wide slits to let steam escape into the flue. It looks fairly flimsy."
);
let grilleKicks = 0;
grille.addVerb(
  new Verb(
    "break",
    true,
    [
      () => {
        grilleKicks++;
        if (grilleKicks === 1) {
          return "You manoeuvre yourself round in order to be able to land a good kick on the grille. You draw your knees up to your chest then slam both feet into the metal covering. You feel it start to give way a little, but it doesn't come off.";
        } else if (grilleKicks === 2) {
          return "You kick again, harder this time. The grille bows in at the middle and one of the rivets holding it in place pops out with a ping.";
        } else if (grilleKicks === 3) {
          grille.broken = true; // Adding new property for convenience
          insideOven.removeItem(grille);
          return "You put all the effort you can muster into a final kick. As your feet land home, this time the grille gives way, the remaining rivets at last giving up the fight. The twisted metal goes clattering down into the space at the back of the oven, out of sight.";
        }
      }
    ],
    [],
    ["kick", "remove"]
  )
);

// Stew is revealed when the dish is tipped
const stew = new Item(
  "stew",
  "It's thick and lumpy and smells of...you have no idea what that is. It does not smell good."
);

stew.addVerb(
  new Verb(
    "taste",
    true,
    "You dip your finger in the stew where it's spilled at the rear of the oven. It's still cold. You gingerly raise your finger to your lips. The smell is powerful. You've changed your mind - this is a bad idea.",
    [],
    ["try", "eat"]
  )
);

const dish = new Item(
  "dish",
  "It's a vaguely elliptical ceramic dish, sitting on the shelf above you. You can't see whether there's anything in it, but you can reach up and touch its underside between the wires of the shelf."
);

dish.addVerb(
  new Verb(
    "touch",
    true,
    "The underside is smooth to the touch. Pushing against it gently, it feels heavy, as though it's full of something. Maybe you could tip some of the contents out."
  )
);

const revealStew = () => {
  if (!insideOven.items["stew"]) {
    insideOven.addItem(stew);
  }
};

const tip = new Verb(
  "tip",
  () => grille.broken && fireBurning,
  [
    revealStew,
    () => (fireBurning = false),
    () => hottingUp.cancel(),
    "You reach up and lift the dish, pouring some of the contents through the hole into the flue at the rear of the oven. The wet stew slops down the pipe to the coal compartment below, sending up a hiss as the burning coals are smothered. The fire's out! You breathe a sigh of relief."
  ],
  () => {
    if (!grille.broken) {
      revealStew();
      return "Pushing your fingers between the wires of the rack, you lift the dish at one end, pouring some of the contents out. It runs down the back of the oven, dripping from the slits of the grille. It appears to be some kind of lumpy stew.";
    } else if (!fireBurning) {
      return "The fire's out - you can relax.";
    }
  },
  ["push", "pour", "empty"]
);

dish.addVerb(tip);
stew.addVerb(tip);

const flueItem = new Item("flue", () => {
  let description =
    "It's a large metal pipe at the back of the chimney. The hole behind the grille is just about big enough that you could squeeze through it.";
  if (fireBurning) {
    description +=
      " You can see tongues of flame licking up the pipe from below.";
  } else {
    description += " The pipe looks dark now the fire's out.";
  }
  return description;
});

flueItem.addVerb(
  new Verb(
    "enter",
    () => grille.broken && !fireBurning,
    [
      "You squeeze head first through the hole and into the metal flue. Above you the pipe opens out into a wide chimney. Just below you is the coal compartment, where some of the coals are still dimly glowing. You decide against crawling over those.",
      () => goToRoom(flue)
    ],
    [
      () => {
        if (!grille.broken) {
          return "The metal grille is in the way.";
        } else {
          return "You poke your head through the hole into the flue, then quickly withdraw it. Tongues of orange flame are licking their way up the pipe from the burning coals below and the heat in there is intense.";
        }
      }
    ],
    ["crawl", "slide", "go"]
  )
);

setInsideOven(this); // Avoid circular dependencies

insideOven.addItem(lockedOvenDoor);
insideOven.addItem(vent);
insideOven.addItem(grille);
insideOven.addItem(flueItem);
insideOven.addItem(dish);
