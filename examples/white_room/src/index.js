import {
  attach,
  initGame,
  Item,
  play,
  RandomText,
  Room,
  setIntro,
  setInventoryCapacity,
  setStartingRoom,
  Verb
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
    recordLogs: true,
    feedbackHandler: (feedback, name, logs) => console.log({ feedback, name, logs }),
    randomSeed: "white-room."
  },
  setUp
);

function setUp() {
  const whiteRoom = new Room(
    "White Room",
    "The room you find yourself in is a nearly perfect cube. It gleams a futuristic white, each surface emitting a soft, uniform glow. There are no shadows at all.\n\nIn front of you, there's a pedestal topped by a single red button. To your right, there's an almost identical green one.\n\nThere's a flat object at about waist height that could be a table.\n\nA corridor to the East leads to another room.",
    true
  );

  const redRoom = new Room(
    "Red Room",
    "This room is much like the white room, all featureless glowing surfaces and no windows, but the light being emitted from the unnaturally smooth floor, walls and ceiling is blood red.\n\nThe white room lies to the West.",
    true
  );

  whiteRoom.setEast(redRoom);

  const dial = new Item.Builder("dial").build();

  const strangeDevice = new Item.Builder("strange device")
    .isHoldable()
    .withSize(2)
    .withDescription(
      (item) =>
        `It's a sleek metal object that fits neatly in your hand. There's a dial on one side. It's set to ${item.get(
          "setting"
        )}.`
    )
    .withProperty("setting", "stun")
    .hidesItems(dial)
    .build();

  dial.addVerb(
    new Verb.Builder("turn")
      .withOnSuccess(() => {
        let setting = strangeDevice.get("setting");

        if (setting === "stun") {
          setting = "tickle";
        } else if (setting === "tickle") {
          setting = "amaze";
        } else {
          setting = "stun";
        }

        strangeDevice.set("setting", setting);
        return `You turn the dial to ${setting}.`;
      })
      .build()
  );

  const apple = new Item.Builder("apple").isHoldable().withSize(1).withDescription("A juicy red apple.").build();

  const orange = new Item.Builder("orange").isHoldable().withSize(1).withDescription("A round, waxy orange.").build();

  const table = new Item.Builder("table")
    .withCapacity(10)
    .withDescription("It's plain white and waist height. It's flat enough to act as a table.")
    .withPreposition("on")
    .build();

  const buttonActions = new RandomText(
    "A blue square appears on the wall.",
    "A strange symbol, somewhat resembling a double helix is displayed on the white surface of the wall.",
    "The wall displays a green circle.",
    "A pattern of intersecting triangles appears",
    "A black cross forms on the wall ahead."
  );

  const redButton = new Item.Builder("red button")
    .withDescription("It's extremely tempting to press it.")
    .withVerbs(new Verb.Builder("press").withOnSuccess(buttonActions).build())
    .build();

  const greenButton = new Item.Builder("green button")
    .withDescription("Your fingers itch to press it.")
    .withVerbs(
      new Verb.Builder("press").withOnSuccess("## CONSIDER\n\nThis is the message that appears before you.").build()
    )
    .build();

  whiteRoom.addItems(strangeDevice, redButton, greenButton, table, apple, orange);
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
