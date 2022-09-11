import {
  attach,
  initGame,
  Item,
  play,
  Room,
  setIntro,
  setInventoryCapacity,
  setStartingRoom
} from "../../../lib/gonorth";
import "./index.css";

initGame(
  "The White Room",
  "Rich Locke",
  {
    storeName: "whiteroom",
    debugMode: true,
    skipReactionTimes: true,
    renderFeedbackBox: true,
    recordLogs: false,
    feedbackHandler: (x) => x
  },
  setUp
);

function setUp() {
  const whiteRoom = new Room(
    "White Room",
    "The room you find yourself in is a nearly perfect cube. It gleams a futuristic white, each surface emitting a soft, uniform glow. There are no shadows at all.\n\nA corridor to the East leads to another room.",
    true
  );

  const redRoom = new Room(
    "Red Room",
    "This room is much like the white room, all featureless glowing surfaces and no windows, but the light being emitted from the unnaturally smooth floor, walls and ceiling is blood red.\n\nThe white room lies to the West.",
    true
  );

  whiteRoom.setEast(redRoom);

  const strangeDevice = new Item.Builder("strange device")
    .isHoldable()
    .withSize(2)
    .withDescription("It's a sleek metal object that fits neatly in your hand.")
    .build();

  whiteRoom.addItems(strangeDevice);
  setInventoryCapacity(10);
  setStartingRoom(whiteRoom);
}

setIntro([
  "You awaken slowly, as if from the deepest sleep, and gradually become aware that something is very wrong.",
  "You realise you have no idea where you are and no memory of how you got here."
]);

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  attach(container);
}

play();
