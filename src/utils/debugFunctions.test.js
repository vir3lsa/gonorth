import { Room } from "../game/items/room";
import { getStore, registerStore, unregisterStore } from "../redux/storeRegistry";
import { newGame, changeInteraction } from "../redux/gameActions";
import { Parser } from "../game/parser";
import { Door } from "../game/items/door";
import { Item } from "../game/items/item";
import { Verb } from "../game/verbs/verb";
import { initGame } from "../gonorth";
import { goToRoom } from "./lifecycle";
import { PagedText } from "../game/interactions/text";
import { initStore } from "../redux/store";

jest.mock("../utils/consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game, hall, north, door, chair, redBall, blueBall, redBox, blueBox, chairman, cushion;

const inputTest = async (input, expectedOutput, ...expectedOmissions) => {
  await new Parser(input).parse();
  const expected = Array.isArray(expectedOutput) ? expectedOutput : [expectedOutput];
  expected.forEach((output) => {
    expect(getStore().getState().game.interaction.currentPage).toInclude(output);
  });

  expectedOmissions.forEach((expectedOmission) => {
    expect(getStore().getState().game.interaction.currentPage).not.toInclude(expectedOmission);
  });
};

describe("debugFunctions", () => {
  beforeEach(() => {
    unregisterStore();
    initStore();

    hall = new Room("Hall", "grand");
    north = new Room("Garden", "");
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
    hall.addItem(blueBall);
    north.addItems(door, chair, chairman, cushion, redBall, redBox, blueBox);
    north.setNorth(new Room("Orangery", "Light and airy"));

    game = initGame("The Giant's Castle", false);
    getStore().dispatch(newGame(game, true));
    goToRoom(hall);
    door.open = false;
    getStore().dispatch(changeInteraction(new PagedText("")));

    if (!hall.items["cushion"]) {
      hall.addItem(cushion);
    }
  });

  it("displays help", () => inputTest("debug help", "Usage:"));
  it("goes to an unconnected room", () => inputTest("debug goto orangery", "Light and airy"));
  it("shows available items", () =>
    inputTest("debug show available items", "Items:\n\n- blue ball", "red ball", "orangery"));
  it("shows all items", () =>
    inputTest("debug show items", ["Items:", "blue ball", "red ball", "Orangery", "chair man"]));
  it("spawns items not in the room", () => {
    inputTest("debug spawn red ball", "Spawned red ball in Hall");
    inputTest("take red ball", "the red ball");
    inputTest("i", "red ball");
  });
  it("disambiguates when spawning items", () => inputTest("debug spawn ball", "Which ball do you mean?"));
});
