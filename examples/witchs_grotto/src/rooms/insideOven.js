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
  addSchedule
} from "../../../../lib/gonorth";

export const insideOven = new Room(
  "inside oven",
  "It's dim in here but there's a small amount of light seeping in through a vent high in the door. There's a grille at the back over an opening leading into the flue. There appears to be a large dish of some kind on the shelf above you."
);

export const hottingUp = new Schedule.Builder()
  .withCondition(() => getRoom() === insideOven)
  .addEvent("It's starting to feel warm under you.")
  .withDelay(2)
  .withDelayType(TIMEOUT_TURNS)
  .addEvent("It's definitely getting hot in here now.")
  .withDelay(3)
  .withDelayType(TIMEOUT_TURNS)
  .addEvent(
    "It's really hot now, like a sauna. You're covered in sweat - it drips from your nose and evaporates on the hot metal."
  )
  .withDelay(3)
  .withDelayType(TIMEOUT_TURNS)
  .addEvent(
    "You need to get out of here. Now. The air is so hot you can feel it burning your face. It's impossible to touch the metal walls and floor of the oven without getting a nasty burn. You're starting to feel faint."
  )
  .withDelay(4)
  .withDelayType(TIMEOUT_TURNS)
  .addEvent(
    "You frantically thrash as your hair starts to smoulder and sores appear on your skin. You take a few more ragged breaths, drawing the burning air into your lungs and then collapse in a fit of coughing and spluttering. Everything goes dark."
  )
  .withDelay(20000)
  .withDelayType(TIMEOUT_MILLIS)
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
          insideOven.removeItem(grille);
          return "You put all the effort you can muster into a final kick. As your feet land home, this time the grille gives way, the remaining rivets at last giving up the fight. The twisted metal goes clattering down into the space at the back of the oven, out of sight.";
        }
      }
    ],
    [],
    ["kick", "remove"]
  )
);

insideOven.addItem(lockedOvenDoor);
insideOven.addItem(vent);
insideOven.addItem(grille);
