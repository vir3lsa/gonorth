import Room from "./room";
import { getStore } from "../redux/storeRegistry";
import { newGame, changeInteraction } from "../redux/gameActions";
import { Parser } from "./parser";
import Door from "./door";
import Item from "./item";
import { Verb } from "./verb";
import { initGame } from "../gonorth";
import { goToRoom } from "../utils/lifecycle";
import { PagedText } from "./text";

jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game;
const hall = new Room("Hall", "grand");
const north = new Room("Garden", "");
const south = new Room("Kitchen", "");
const east = new Room("Scullery", "");
const west = new Room("Pantry", "");
const door = new Door("trapdoor", "", false);
const chair = new Item("chair", "comfy", false, 0, new Verb("sit in"));
chair.capacity = 5;
chair.preposition = "in";
const chairman = new Item("chair man", "impressive");
const cushion = new Item("cushion", "plush", true, 2);
new Verb("jump on"); // Should add verb to global registry
door.aliases = ["hatch", "trap door", "door"];
door.getVerb("open").addAliases("give a shove to");

hall.setNorth(north);
hall.setSouth(south);
hall.setEast(east);
hall.setWest(west);
hall.addItems(door, chair, chairman, cushion);

expect.extend({
  toInclude(received, text) {
    const pass = received.includes(text);
    return {
      message: () =>
        `expected '${received}' ${pass ? "not " : ""}to contain '${text}'`,
      pass
    };
  }
});

const directionTest = async (input, expectedRoom) => {
  const actionPromise = new Parser(input).parse();
  setTimeout(() =>
    getStore()
      .getState()
      .game.interaction.options[0].action()
  );
  await actionPromise;
  expect(game.room.name).toBe(expectedRoom);
};

const openDoorTest = input => {
  new Parser(input).parse();
  expect(door.open).toBe(true);
};

const inputTest = async (input, expectedOutput) => {
  await new Parser(input).parse();
  expect(getStore().getState().game.interaction.currentPage).toInclude(
    expectedOutput
  );
};

describe("parser", () => {
  describe("directions", () => {
    beforeEach(() => {
      game = initGame("The Giant's Castle", false);
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
      inputTest("put mug in chair", "how to put the chair"));
    it("gives feedback when the second item isn't recognised", () =>
      inputTest("put cushion in sofa", "how to put the cushion"));
    it("gives feedback when the second item isn't a container, deferring to verb", () =>
      inputTest("put cushion in chair man", "can't put the cushion"));
    it("allows interaction with items inside other items", () => {
      inputTest("put cushion in chair", "You put the cushion in the chair");
      inputTest("take cushion", "You take the cushion");
    });
    it("allows rooms to be referred to by name", () =>
      inputTest("x hall", "grand"));
    it("allows rooms to be referred to generically", () =>
      inputTest("x room", "grand"));
    it("allows items to be put on the floor", () =>
      inputTest("put cushion on the floor", "You put the cushion in the Hall"));
  });
});
