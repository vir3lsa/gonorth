import { Room, Door, Item, Verb, CyclicText } from "../../../../lib/gonorth";

export const insideOven = new Room(
  "inside oven",
  "It's dim in here but there's a small amount of light seeping in through a vent high in the door. There's a grill at the back over an opening leading into the flue. There appears to be a large dish of some kind on the shelf above you."
);

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

insideOven.addItem(lockedOvenDoor);
