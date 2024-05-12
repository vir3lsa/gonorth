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
  Verb,
  Event,
  TIMEOUT_MILLIS,
  TIMEOUT_TURNS,
  addEvent,
  selectInventory,
  addHintNodes,
  next,
  previous,
  okay,
  setHintNodeId,
  OptionGraph,
  gameOver,
  Door
} from "../../../lib/src/gonorth";
import "./index.css";
import whiteRoomImage from "./whiteRoom.gif";
import whiteRoomTitle from "./whiteRoomTitle.gif";

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
    randomSeed: "white-room.",
    referToPlayerAs: "Toby",
    startScreenImage: whiteRoomTitle
  },
  "0.0.2",
  setUp
);

function setUp() {
  const whiteRoom = new Room.Builder("White Room")
    .withDescription(
      "The room you find yourself in is a nearly perfect cube. It gleams a futuristic white, each surface emitting a soft, uniform glow. There are no shadows at all.\n\nIn front of you, there's a pedestal topped by a single red button. To your right, there's an almost identical green one.\n\nThere's a flat object at about waist height that could be a table.\n\nCorridors to the east and west lead to other rooms."
    )
    .withImage(whiteRoomImage)
    .isCheckpoint()
    .build();

  const redRoom = new Room(
    "Red Room",
    "This room is much like the white room, all featureless glowing surfaces and no windows, but the light being emitted from the unnaturally smooth floor, walls and ceiling is blood red.\n\nThe white room lies to the west.",
    true
  );

  const greenRoom = new Room(
    "Green Room",
    "The room's a beautiful forest green. The white room's to the east. There's a panelled door in the wall in front of you.",
    true
  );

  greenRoom.addItems(
    new Door.Builder("panelled door")
      .isOpen(false)
      .addTraversal(
        new Door.TraversalBuilder()
          .withAliases("transit")
          .withOrigin("green room")
          .withDestination("red room")
          .withTest(({ item: door }) => door.open, "The door is closed.")
          .withTest(
            () => Boolean(selectInventory().itemArray.find((item) => item.name === "strange device")),
            "You have to be holding the strange device, for some reason."
          )
          .onSuccess("You step into the green wall, through the door, and find yourself in the red room.")
      )
      .build()
  );

  whiteRoom.setEast(redRoom);
  whiteRoom.setWest(greenRoom);

  // Add a condition for going to the green room.
  whiteRoom
    .getVerb("west")
    .addTest(
      () => Boolean(selectInventory().itemArray.find((item) => item.name === "strange device")),
      "You have to be holding the strange device, for some reason."
    );

  const dial = new Item.Builder("dial").build();

  const strangeDevice = new Item.Builder("strange device")
    .isHoldable()
    .withSize(2)
    .withDescription(
      (item) =>
        `It's a sleek metal object that fits neatly in your hand. There's a dial on one side and a trigger underneath. It's set to ${item.get(
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

  const laserHoleEvent = new Event.Builder("laserHole")
    .withAction("Belatedly, a hole appears in the wall where the white beam hit it.")
    .withTimeout(5)
    .withTimeoutType(TIMEOUT_TURNS)
    .withCondition(false)
    .isRecurring()
    .build();

  const fireEvent = new Event.Builder("fire")
    .withAction(() => {
      laserHoleEvent.commence();
      return "There's a loud *bang* and a thin line of blinding white light briefly emits from the nozzle of the device.";
    })
    .withTimeout(10000)
    .withTimeoutType(TIMEOUT_MILLIS)
    .isRecurring()
    .build();

  addEvent(laserHoleEvent);

  strangeDevice.addVerb(
    new Verb.Builder("fire").withOnSuccess(() => fireEvent.commence(), "You pull the trigger. Nothing happens.").build()
  );

  strangeDevice.addVerb(
    new Verb.Builder("smash")
      .withOnSuccess("You smash the device on the floor. It explodes. You die.", gameOver)
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

  const largeObject = new Item.Builder("large object")
    .withDescription("It's featureless.")
    .withSize(9)
    .isHoldable()
    .build();

  const shoutGraph = new OptionGraph.Builder("shout")
    .withNodes(
      new OptionGraph.NodeBuilder("shout1").withActions("The lights go out.").withOptions({
        "Stop shouting": {
          actions: "To your relief, the lights turn back on.",
          exit: true
        },
        "Shout louder": false,
        Squeal: "shout2"
      }),
      new OptionGraph.NodeBuilder("shout2").withActions("Here come the lights.")
    )
    .withImage(whiteRoomTitle)
    .build();
  whiteRoom.addVerb(new Verb.Builder("shout").withOnSuccess(() => shoutGraph.commence()).build());

  whiteRoom.addItems(strangeDevice, redButton, greenButton, table, apple, orange, largeObject);
  setInventoryCapacity(10);
  setStartingRoom(whiteRoom);

  setIntro([
    "You awaken slowly, as if from the deepest sleep, and gradually become aware that something is very wrong.",
    "You realise you have no idea where you are and no memory of how you got here."
  ]);

  addHintNodes(
    {
      id: "hint1",
      actions: "Have you seen the device?",
      options: {
        okay,
        next
      }
    },
    {
      id: "hint2",
      actions: "Have you tried pressing the button?",
      options: {
        okay,
        next,
        previous
      }
    },
    {
      id: "hint3",
      actions: "Have you walked down the corridor?",
      options: {
        okay,
        previous
      }
    }
  );

  setHintNodeId("hint1");
}

if (typeof document !== "undefined") {
  let container = document.querySelector("#container");
  attach(container);
}

play();
