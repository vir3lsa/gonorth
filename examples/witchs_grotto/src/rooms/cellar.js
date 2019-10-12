import { Room, Door } from "../../../../lib/gonorth";
import { cellarNook } from "./cellarNook";
import { kitchen } from "./kitchen";

export const cellar = new Room(
  "Cellar",
  "The cellar is dark, damp and smells of rotting Earth. That old crone shut you down here, cackling as she swung the trapdoor shut. Rough stone steps lead up towards it in one corner, whilst the closed double doors of a coal hatch are recessed into the low stone roof on the east side. A narrow archway leads deeper into the cellar to the west."
);

const trapdoor = new Door(
  "trapdoor",
  "It's made of thick, heavy oak and opens upwards.",
  false,
  false,
  "You crouch at the top of the steep stone steps with your shoulders pressed against the rough boards of the trapdoor. As you heave upwards it lifts slowly into the room above, making a loud *thud* as it swings over and hits the floor."
);
trapdoor.aliases = ["trap door"];

const coalHatch = new Door(
  "coal hatch",
  "Double doors that open upwards and outwards to allow coal to be shovelled in.",
  false,
  true
);
coalHatch.aliases = ["hatch"];
const unlockCoalHatch = coalHatch.getVerb("unlock");
unlockCoalHatch.test = false;
unlockCoalHatch.onFailure = "The coal hatch is bolted from the other side.";

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
  "The ceiling comes down to practically meet the floor at the back of the cellar. There's nowhere to go."
);
cellar.setEast(null, coalHatch, null, "The coal hatch is shut.");
cellar.setUp(
  kitchen,
  trapdoor,
  "You climb carefully out of the trapdoor, glancing around furtively.",
  "The trapdoor's shut but moves when you push experimentally against it, as if the old bat forgot to lock it. You think you can probably heave it open with a bit of strength."
);

cellar.addItem(trapdoor);
cellar.addItem(coalHatch);
