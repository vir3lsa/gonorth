import {
  addSchedule,
  attach,
  getRoom,
  initGame,
  play,
  setIntro,
  setInventoryCapacity,
  setStartingRoom,
  TIMEOUT_MILLIS,
  Route,
  TIMEOUT_TURNS,
  Event,
  addEvent,
  selectPlayer,
  addKeyword,
  Verb,
  setHintNodeId,
  selectRoom
} from "../../../lib/gonorth";
import { cellar } from "./rooms/cellar";
import { pantry } from "./rooms/pantry";
import { witch } from "./rooms/garden";
import { hottingUp } from "./rooms/insideOven";
import { apothecary, strengthTimer } from "./rooms/apothecary";
import { RandomText } from "../../../lib/game/interactions/text";
import { lowerSpiral } from "./rooms/lowerSpiral";
import { snug } from "./rooms/snug";
import { southHall } from "./rooms/southHall";
import { diningRoom } from "./rooms/diningRoom";
import { kitchen } from "./rooms/kitchen";
import { entranceHall } from "./rooms/entranceHall";
import { staircase } from "./rooms/staircase";
import { bedroom } from "./rooms/bedroom";
import { initHints } from "./utils/hints";

initGame("The Lady of Bramble Wood", "Rich Locke", true);
setIntro("Now's your chance. Quickly! Make your escape whilst the witch is out.");
initHints("bedroom1");

setStartingRoom(cellar);
// setStartingRoom(flue);
// setStartingRoom(apothecary);
// setStartingRoom(lowerSpiral);
// setStartingRoom(snug);
// setStartingRoom(southHall);
// setStartingRoom(diningRoom);
// setStartingRoom(pantry);
// setStartingRoom(kitchen);
// setStartingRoom(entranceHall);
// setStartingRoom(staircase);
// setStartingRoom(bedroom);

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  attach(container);
}

addKeyword(
  new Verb(
    "recall",
    true,
    () => {
      const words = [...selectPlayer().uniqueItems].filter((item) => item.recall).map((item) => item.name);

      if (words.length) {
        return `You bring to mind all the magic words, charms and incantations you've learned. You know:\n\n${words.join(
          "  \n"
        )}`;
      } else {
        return "You haven't learned anything useful that you can recall.";
      }
    },
    null,
    ["remember", "magic", "words"],
    true,
    "Recall magic words you've learnt."
  )
);

const witchArrival = new Route.Builder()
  .withSubject(witch)
  .withCondition(() => getRoom() === pantry)
  .withContinueOnFail(false)
  .withFindPlayerText(
    "You hear a noise behind you and whirl round in time to see a tall woman dressed in a black shawl slip into the room."
  )
  .go("south")
  .withDelay(10000, TIMEOUT_MILLIS)
  .withText("A door slams somewhere nearby. The witch is coming!")
  .go("west")
  .withDelay(2, TIMEOUT_TURNS)
  .withText(
    "You hear footsteps. Sounds like they're coming from the kitchen. Hide!"
  )
  .go("south")
  .withDelay(10000, TIMEOUT_MILLIS)
  .withText(
    "A door creaks, sending shivers down your spine. The witch is looking for you."
  )
  .go("east")
  .withDelay(3, TIMEOUT_TURNS)
  .withText("Another door slams. Where *is* she?")
  .go("east")
  .withDelay(3, TIMEOUT_TURNS)
  .withText("Muffled footsteps sound elsewhere in the house. Be careful.")
  .build();

addSchedule(witchArrival);
addSchedule(hottingUp);
addSchedule(strengthTimer);

witch.addEncounter(
  () => witchArrival.cancel(),
  `The witch is here.
  
Your blood runs cold as her icy blue eyes fix you to the spot. For a moment, neither of you move, then suddenly she *lunges* for you, a snarl twisting her face.`
);

const upstairsSounds = new RandomText(
  "Somewhere there's a dog barking.",
  "Is that a baby crying?",
  "The distant clatter of something metallic being dropped reminds you you're not alone here.",
  "Floorboards creek. Was it just your imagination?",
  "What was that? Something went scuttling into the corner.",
  "A flock of crows loudly takes flight from a tree outside.",
  "An owl hoots dolefully. Such an otherworldly sound."
);

const downstairsSounds = new RandomText(
  "Distantly, there's a dog barking.",
  "Is that a baby mewling?",
  "What was that? In the wall. You're sure you heard something knocking.",
  "You hear something behind you. You whirl around, but there's nothing there.",
  "Footsteps overhead. Who's up there?",
  "Did you see that? Something went scuttling into the corner.",
  "A sudden gust of chilled air hits you. Where did it come from?"
);

addEvent(
  new Event(
    "environment sounds",
    () => {
      console.log(selectRoom().name);
      if (
        [
          "Kitchen",
          "Bedroom",
          "Cupboard",
          "Dining Room",
          "Entrance Hall",
          "Pantry",
          "South Hall",
          "Staircase",
          "inside oven"
        ].some((roomName) => roomName === selectRoom().name)
      ) {
        return upstairsSounds;
      } else {
        return downstairsSounds;
      }
    },
    () => selectRoom() && Math.random() * 20 > 19,
    0,
    TIMEOUT_TURNS,
    (x) => x,
    true
  )
);

setInventoryCapacity(10);
play();
