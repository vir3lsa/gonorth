import gonorth from "../../../lib/gonorth";
import Room from "../../../lib/game/room";

const game = gonorth.createGame("The Witch's Grotto");
game.author = "Rich Locke";
game.intro =
  "Now's your chance. Quickly! Make your escape whilst the witch is out.";

const cellar = new Room(
  "Cellar",
  "The cellar is dark, damp and smells of rotting Earth. Rough stone steps lead up towards a trapdoor in one corner, whilst the closed double doors of a coal hatch are recessed into the low stone roof on the other side. A narrow archway leads deeper into the cellar to the west."
);
const cellarNook = new Room(
  "Cellar Nook",
  "It's extremely dark in here and you can't make out a thing. The roof is so low you have to constantly duck your head and the floor is uneven, daring you to trip. You feel your way along one wall with your hands outstretched. Looking back, you can't even see the archway you came through. The nook continues to the West, but going any further without a light would be unwise."
);

cellar.setWest(cellarNook, true);
game.startingRoom = cellar;

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  game.attach(container);
}

game.play();
