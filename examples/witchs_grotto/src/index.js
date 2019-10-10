import gonorth from "../../../lib/gonorth";
import Room from "../../../lib/game/room";
import { cellar } from "./rooms/cellar";

const game = gonorth.createGame("The Witch's Grotto", true);
game.author = "Rich Locke";
game.intro =
  "Now's your chance. Quickly! Make your escape whilst the witch is out.";

game.startingRoom = cellar;

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  game.attach(container);
}

game.play();
