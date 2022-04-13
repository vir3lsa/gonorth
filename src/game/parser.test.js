import { Room } from "./items/room";
import { getStore } from "../redux/storeRegistry";
import { newGame, changeInteraction } from "../redux/gameActions";
import { Parser } from "./parser";
import { Door } from "./items/door";
import { Item } from "./items/item";
import { Verb } from "./verbs/verb";
import { initGame } from "../gonorth";
import { goToRoom } from "../utils/lifecycle";
import { PagedText } from "./interactions/text";
import { selectCurrentPage } from "../utils/testSelectors";

jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game, hall, north, south, east, west, door, chair, redBall, blueBall, redBox, blueBox, chairman, cushion;

const directionTest = async (input, expectedRoom) => {
  const actionPromise = new Parser(input).parse();
  setTimeout(() => getStore().getState().game.interaction.options[0].action());
  await actionPromise;
  expect(game.room.name).toBe(expectedRoom);
};

const openDoorTest = (input) => {
  new Parser(input).parse();
  expect(door.open).toBe(true);
};

const inputTest = async (input, expectedOutput) => {
  await new Parser(input).parse();
  expect(selectCurrentPage()).toInclude(expectedOutput);
};

describe("parser", () => {
  describe("directions", () => {
    beforeEach(() => {
      hall = new Room("Hall", "grand");
      north = new Room("Garden", "");
      south = new Room("Kitchen", "");
      east = new Room("Scullery", "");
      west = new Room("Pantry", "");
      door = new Door("trapdoor", "", false);
      chair = new Item("chair", "comfy", false, 0, new Verb("sit in"));
      redBall = new Item("red ball", "It's a rouge ball", true);
      blueBall = new Item("blue ball", "It's an azure ball", true);
      redBox = new Item("red box");
      blueBox = new Item("blue box");
      redBall.aliases = "ball";
      blueBall.aliases = "ball";
      redBox.aliases = "box";
      blueBox.aliases = "box";
      redBox.capacity = 5;
      blueBox.capacity = 5;
      chair.capacity = 5;
      chair.preposition = "in";
      chairman = new Item("chair man", "impressive");
      chairman.aliases = [];
      cushion = new Item("cushion", "plush", true, 2);
      new Verb("jump on"); // Should add verb to global registry
      door.aliases = ["hatch", "trap door", "door"];
      door.getVerb("open").addAliases("give a shove to");

      hall.setNorth(north);
      hall.setSouth(south);
      hall.setEast(east);
      hall.setWest(west);
      hall.addItems(
        door,
        chair,
        chairman,
        cushion,
        redBall,
        blueBall,
        redBox,
        blueBox
      );

      game = initGame("The Giant's Castle", "", { debugMode: false });
      getStore().dispatch(newGame(game, true));
      goToRoom(hall);
      door.open = false;
      getStore().dispatch(changeInteraction(new PagedText("")));

      if (!hall.items["cushion"]) {
        hall.addItem(cushion);
      }
    });

    it("goes North", () => directionTest("North", "Garden"));
    it("goes South", () => directionTest("South", "Kitchen"));
    it("goes East", () => directionTest("East", "Scullery"));
    it("goes West", () => directionTest("West", "Pantry"));
    it("ignores case", () => directionTest("NORTH", "Garden"));
    it("responds to alias", () => directionTest("forward", "Garden"));
    it("responds to another alias", () => directionTest("left", "Pantry"));
    it("responds to an item alias", () => openDoorTest("open hatch"));
    it("responds when the direction verb is the second word", () =>
      directionTest("go north", "Garden"));
    it("responds when the direction verb is the third word", () =>
      directionTest("now go north", "Garden"));
    it("responds when there are words between verb and item", () =>
      openDoorTest("now open the heavy trap door"));
    it("responds to multi-word verbs", () =>
      openDoorTest("now give a shove to the trapdoor"));
    it("gives a suitable message if the player types nonsense", () =>
      inputTest("feed bread to the ducks", "confusion"));
    it("gives message if verb is recognised but not item", () =>
      inputTest("open fridge", "don't seem able to open that"));
    it("gives message if item doesn't support verb", () =>
      inputTest("sit in door", "can't see how to sit in the door"));
    it("gives message if item found but no verb", () =>
      inputTest("set fire to chair", "can't easily do that to the chair"));
    it("gives message if global verb and local item found", () =>
      inputTest("jump on chair", "can't see how to jump on the chair"));
    it("gives message if global verb and no local item found", () =>
      inputTest("jump on skateboard", "don't seem able to jump on that"));
    it("tries more specific items first", () =>
      inputTest("x chair man", "impressive"));
    it("handles prepositional verbs", () =>
      inputTest("put the cushion in the chair", "cushion in the chair"));
    it("gives feedback when the first item isn't recognised", () =>
      inputTest("put mug in chair", "You can't put that in the chair"));
    it("gives feedback when the second item isn't recognised", () =>
      inputTest("put cushion in sofa", "Put the cushion where?"));
    it("gives feedback when no second item is given", () =>
      inputTest("put cushion", "Put the cushion where?"));
    it("gives feedback when the second item isn't a container, deferring to verb", () =>
      inputTest("put cushion in chair man", "can't put the cushion"));
    it("allows interaction with items inside other items", async () => {
      await inputTest(
        "put cushion in chair",
        "You put the cushion in the chair"
      );
      await inputTest("take cushion", "the cushion");
    });
    it("allows rooms to be referred to by name", () =>
      inputTest("x hall", "grand"));
    it("allows rooms to be referred to generically", () =>
      inputTest("x room", "grand"));
    it("allows items to be put on the floor", () =>
      inputTest("put cushion on the floor", "You put the cushion in the Hall"));
    it("asks for clarification of duplicate aliases", () =>
      inputTest("x ball", "Which ball do you mean?"));
    it("chooses the correct item", () =>
      inputTest("x red ball", "It's a rouge ball"));
    it("chooses the correct other item", () =>
      inputTest("x blue ball", "It's an azure ball"));
    it("asks for clarification of duplicate secondary aliases", () =>
      inputTest("put red ball in box", "Which box do you mean?"));
    it("chooses correct secondary item", () =>
      inputTest("put red ball in red box", "red ball in the red box"));
    it("chooses correct other secondary item", () =>
      inputTest("put red ball in blue box", "red ball in the blue box"));
    it("bails if both items are ambiguous", () => inputTest("put ball in box", "You need to be more specific."));
    it("mentions primary duplicate if secondary is defined", () =>
      inputTest("put ball in red box", "Which ball do you mean?"));
    it("disambiguates when duplicates are in the room and the inventory", async () => {
      await inputTest("take red ball", "the red ball");
      await inputTest("x ball", "Which ball do you mean?");
    });
  });
});
