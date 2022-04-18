import {
  Room,
  Door,
  Event,
  RandomText,
  Item,
  CyclicText,
  SequentialText,
  PagedText,
  Verb,
  TIMEOUT_TURNS,
  addEvent
} from "../../../../lib/gonorth";
import { cellarNook } from "./cellarNook";
import { kitchen } from "./kitchen";

export const cellar = new Room(
  "Cellar",
  "The cellar is dark, damp and smells of rotting Earth. That old crone shut you down here, cackling as she swung the trapdoor shut. Rough stone steps lead up towards it in one corner, whilst the closed double doors of a coal hatch are recessed into the low roof on the east side. A narrow archway leads deeper into the cellar to the west. The wooden ceiling boards give way to stone to the South, as the roof and floor both slope downwards. The room is flooded with murky looking water in that direction.\n\nThe whole space is lit by a single dim orange lightbulb hanging from a wire that disappears between the wooden boards of the ceiling. It casts a pallid glow over everything it touches but its weak light barely reaches the corners of the room.",
  true
);

const lightbulb = new Item(
  "lightbulb",
  new RandomText(
    "It's the kind where you can see the coiled filament inside, even as it glows hotly.",
    "Reaching up to it, you can feel the heat coming off it, but you can't quite stretch your fingers far enough to touch it."
  )
);
lightbulb.aliases = ["light", "bulb"];
lightbulb.addVerb(
  new Verb(
    "take",
    false,
    null,
    "Even standing on tip-toes you can't quite reach it. It would probably be too hot even if you could.",
    ["unscrew", "steal", "grab", "hold"]
  )
);

const ceiling = new Item(
  "ceiling",
  "Much of the ceiling consists of wooden boards but they come to a stop towards the South of the cellar to be replaced by solid stone as the roof slops downwards. It's too high for you to reach, even there."
);
ceiling.aliases = ["roof", "boards"];

const steps = new Item(
  "steps",
  new CyclicText(
    "They look as though they've been carved from the very rock the witch's grotto sits on.",
    "They're worn smooth and dip slightly in the middle of each step from the gradual erosion of passing feet.",
    "They lead up to a trapdoor in the ceiling."
  )
);
steps.aliases = ["stairs", "staircase"];

const archway = new Item(
  "archway",
  "It's a roughly semicircular arch cut into the stone of the western wall of the cellar. Darkness lies beyond."
);
archway.aliases = ["arch", "doorway"];

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
water.canHoldItems = true;

cellar.addItem(water);
cellar.setWest(cellarNook, true);
cellar.setNorth(null, false, null, "There's nothing but the cold stone wall that way. You can't walk through walls.");
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
pale.containerListing = "There's a rusty pale lying on its side near the water's edge.";
pale.capacity = 3;
pale.preposition = "in";

const waterMonster = new Event(
  "water monster",
  () => {
    let text;
    [...water.uniqueItems].forEach((item) => {
      text = new RandomText(
        `The water suddenly churns violently around the ${item.name}. When it's calm again, the ${item.name} is gone.`,
        `With a loud splash and a spray of water the ${item.name} disappears. Was that the flick of a tail you glimpsed?`
      );
      water.removeItem(item);
    });
    return text;
  },
  () => water.uniqueItems.size,
  0,
  TIMEOUT_TURNS
);
waterMonster.recurring = true;
addEvent(waterMonster);

cellar.addItems(trapdoor, coalHatch, pale, steps, archway, ceiling, lightbulb);
