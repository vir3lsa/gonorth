import {
  Room,
  Door,
  RandomText,
  Item,
  SequentialText,
  PagedText
} from "../../../../lib/gonorth";
import { cellarNook } from "./cellarNook";
import { kitchen } from "./kitchen";

export const cellar = new Room(
  "Cellar",
  "The cellar is dark, damp and smells of rotting Earth. That old crone shut you down here, cackling as she swung the trapdoor shut. Rough stone steps lead up towards it in one corner, whilst the closed double doors of a coal hatch are recessed into the low stone roof on the east side. A narrow archway leads deeper into the cellar to the west. The wooden ceiling boards give way to stone to the South, as the roof and floor both slope downwards. The room is flooded with murky looking water in that direction."
);

const trapdoor = new Door(
  "trapdoor",
  [
    "It's made of thick, heavy oak and opens upwards.",
    "If you remember correctly, it leads to the witch's grubby kitchen.",
    "You recall it closing with a loud *bang* as the witch swung it shut, sending a shower of dust cascading down."
  ],
  false,
  false,
  "You crouch at the top of the steep stone steps with your shoulders pressed against the rough boards of the trapdoor. As you heave upwards it lifts slowly into the room above, making a loud *thud* as it swings over and hits the floor."
);
trapdoor.aliases = ["trap door"];

const coalHatch = new Door(
  "coal hatch",
  new RandomText(
    "Double doors that open upwards and outwards to allow coal to be shovelled in.",
    "A small amount of grey light filters through the cracks between the wooden boards.",
    "If you could get it open, it'd be easily big enough to squeeze through and make your escape."
  ),
  false,
  true
);
coalHatch.aliases = ["hatch"];
const unlockCoalHatch = coalHatch.getVerb("unlock");
unlockCoalHatch.test = false;
unlockCoalHatch.onFailure = "The coal hatch is bolted from the other side.";

const bubbles = new Item(
  "bubbles",
  new PagedText(
    "You're sure you saw bubbles. Like something had moved just beneath the surface.",
    "There! Unmistakeable this time. Ripples cross the surface of the opaque black water to lap at the edge just in front of your feet.",
    "There's something in there."
  )
);
bubbles.aliases = ["disturbance", "ripples", "bubble", "ripple", "surface"];

const water = new Item(
  "water",
  new SequentialText(
    "The water looks deep.",
    "The water looks cold.",
    "Are your eyes playing tricks on you, or did bubbles just break the surface a few feet from the edge?"
  )
);
water.aliases = ["flood", "deluge"];
water.hidesItems = bubbles;

cellar.addItem(water);
cellar.setWest(cellarNook, true);
cellar.setNorth(
  null,
  false,
  null,
  "There's nothing but the cold stone wall that way. You can't walk through walls."
);
cellar.setSouth(
  null,
  false,
  null,
  "The water looks dark, cold and deep and eventually meets the ceiling at the back of the cellar. You decide you'd rather stay dry."
);
cellar.setEast(null, coalHatch, null, "The coal hatch is shut.");
cellar.setUp(
  kitchen,
  trapdoor,
  "You climb carefully out of the trapdoor, glancing around furtively.",
  "The trapdoor's shut but moves when you push experimentally against it, as if the old bat forgot to lock it. You think you can probably heave it open with a bit of strength."
);

const pale = new Item(
  "pale",
  "The bucket looks like it's seen better days. It's rusted right through on the bottom. It's not going to be holding water any time soon. The handle is still intact though.",
  true,
  3
);
pale.aliases = ["rusty pale", "bucket"];
pale.roomListing =
  "There's a rusty pale lying on its side near the water's edge.";

cellar.addItem(trapdoor);
cellar.addItem(coalHatch);
cellar.addItem(pale);
