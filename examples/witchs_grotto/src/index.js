import gonorth from "../../../lib/gonorth";
import Room from "../../../lib/game/room";
import Door from "../../../lib/game/door";

const game = gonorth.createGame("The Witch's Grotto");
game.author = "Rich Locke";
game.intro =
  "Now's your chance. Quickly! Make your escape whilst the witch is out.";

const cellar = new Room(
  "Cellar",
  "The cellar is dark, damp and smells of rotting Earth. That old crone shut you down here, cackling as she swung the trapdoor shut. Rough stone steps lead up towards it in one corner, whilst the closed double doors of a coal hatch are recessed into the low stone roof on the east side. A narrow archway leads deeper into the cellar to the west."
);
const cellarNook = new Room(
  "Cellar Nook",
  "It's extremely dark in here and you can't make out a thing. The roof is so low you have to constantly duck your head and the floor is uneven, daring you to trip. You feel your way along one wall with your hands outstretched. Looking back, you can't even see the archway you came through. The nook continues to the West, but going any further without a light would be unwise."
);
const kitchen = new Room("Kitchen", "placeholder");

const trapdoor = new Door(
  "trapdoor",
  "It's made of thick, heavy oak and opens upwards.",
  false
);
trapdoor.aliases = ["trap door"];
const openTrapdoor = trapdoor.getVerb("open");
openTrapdoor.successText =
  "You crouch at the top of the steep stone steps with your shoulders pressed against the rough boards of the trapdoor. As you heave upwards it lifts slowly into the room above, making a loud *thud* as it swings over and hits the floor.";
const coalHatch = new Door(
  "coal hatch",
  "Double doors that open upwards and outwards to allow coal to be shovelled in.",
  false,
  true
);
coalHatch.aliases = ["hatch"];
const unlockCoalHatch = coalHatch.getVerb("unlock");
unlockCoalHatch.test = false;
unlockCoalHatch.failureText = "The coal hatch is bolted from the other side.";

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
game.startingRoom = cellar;

cellar.addItem(trapdoor);
cellar.addItem(coalHatch);

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  game.attach(container);
}

game.play();
