import { Game, Event, TIMEOUT_MILLIS } from "../../../lib/gonorth";
import { cellar } from "./rooms/cellar";
import { pantry } from "./rooms/pantry";

const game = new Game("The Witch's Grotto", true);
game.author = "Rich Locke";
game.intro =
  "Now's your chance. Quickly! Make your escape whilst the witch is out.";

game.startingRoom = cellar;

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  game.attach(container);
}

const witchEnterHall = new Event(
  "A door slams somewhere nearby. The witch is coming!",
  () => game.room === pantry,
  10000,
  TIMEOUT_MILLIS
);

game.addEvent(witchEnterHall);
game.play();
