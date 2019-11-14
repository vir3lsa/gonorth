import {
  Game,
  TIMEOUT_MILLIS,
  Route,
  TIMEOUT_TURNS
} from "../../../lib/gonorth";
import { cellar } from "./rooms/cellar";
import { pantry } from "./rooms/pantry";
import { witch } from "./rooms/garden";

const game = new Game("The Witch's Grotto", true);
game.author = "Rich Locke";
game.intro =
  "Now's your chance. Quickly! Make your escape whilst the witch is out.";

game.startingRoom = cellar;

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  game.attach(container);
}

const witchArrival = new Route.Builder()
  .withSubject(witch)
  .withCondition(() => game.room === pantry)
  .withContinueOnFail(false)
  .withFindPlayerText(
    "You hear a noise behind you and whirl round in time to see a tall woman dressed in a black shawl slip into the room."
  )
  .go("south")
  .withDelay(10000)
  .withDelayType(TIMEOUT_MILLIS)
  .withText("A door slams somewhere nearby. The witch is coming!")
  .go("west")
  .withDelay(2)
  .withDelayType(TIMEOUT_TURNS)
  .withText(
    "You hear footsteps. Sounds like they're coming from the kitchen. Hide!"
  )
  .go("south")
  .withDelay(10000)
  .withDelayType(TIMEOUT_MILLIS)
  .withText(
    "A door creaks, sending shivers down your spine. The witch is looking for you."
  )
  .go("east")
  .withDelay(3)
  .withDelayType(TIMEOUT_TURNS)
  .withText("Another door slams. Where *is* she?")
  .go("east")
  .withDelay(3)
  .withDelayType(TIMEOUT_TURNS)
  .withText("Muffled footsteps sound elsewhere in the house. Be careful.")
  .build();

game.addSchedule(witchArrival);

witch.addEncounter(
  () => witchArrival.cancel(),
  `The witch is here.
  
Your blood runs cold as her icy blue eyes fix you to the spot. For a moment, neither of you move, then suddenly she *lunges* for you, a snarl twisting her face.`
);

game.setInventoryCapacity(10);
game.play();
