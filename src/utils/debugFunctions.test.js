import { Room } from "../game/items/room";
import { getStore } from "../redux/storeRegistry";
import { changeInteraction } from "../redux/gameActions";
import { Parser } from "../game/input/parser";
import { Door } from "../game/items/door";
import { Item } from "../game/items/item";
import { Verb } from "../game/verbs/verb";
import { initGame } from "../gonorth";
import { goToRoom } from "./lifecycle";
import { PagedText } from "../game/interactions/text";
import { OptionGraph } from "../game/interactions/optionGraph";
import { selectCurrentPage } from "./testSelectors";

jest.mock("../utils/consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let hall, north, door, chair, redBall, blueBall, redBox, blueBox, chairman, cushion;

const inputTest = async (input, expectedOutput, ...expectedOmissions) => {
  await new Parser(input).parse();
  const expected = Array.isArray(expectedOutput) ? expectedOutput : [expectedOutput];
  expected.forEach((output) => {
    expect(selectCurrentPage()).toInclude(output);
  });

  expectedOmissions.forEach((expectedOmission) => {
    expect(selectCurrentPage()).not.toInclude(expectedOmission);
  });
};

describe("debugFunctions", () => {
  beforeEach(() => {
    initGame("The Giant's Castle", "", { debugMode: false });

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

    goToRoom(hall);
    door.open = false;
    getStore().dispatch(changeInteraction(new PagedText("")));

    if (!hall.items["cushion"]) {
      hall.addItem(cushion);
    }

    const graph = new OptionGraph(
      "numbers",
      { id: "1", actions: "one", options: { two: "2" } },
      { id: "2", actions: "two", options: { two: "3" } },
      { id: "3", actions: "three", options: { two: "1" } }
    );
  });

  it("displays help", () => inputTest("debug help", "Usage:"));
  it("goes to an unconnected room", () => inputTest("debug goto orangery", "Light and airy"));
  it("shows available items", () =>
    inputTest("debug show available items", "Items:\n\n- blue ball", "red ball", "orangery"));
  it("shows all items", () =>
    inputTest("debug show items", ["Items:", "blue ball", "red ball", "Orangery", "chair man"]));
  it("spawns items not in the room", async () => {
    await inputTest("debug spawn red ball", "Spawned red ball in Hall");
    await inputTest("take red ball", "the red ball");
    inputTest("i", "red ball");
  });
  it("disambiguates when spawning items", () => inputTest("debug spawn ball", "Which ball do you mean?"));
  it("shows a list of option graphs", () =>
    inputTest("debug show option graphs", ["Option Graphs:", "wait", "numbers"]));
  it("shows option graph nodes", () => inputTest("debug show graph numbers", ["Nodes:", "1", "2", "3"]));
  it("commences an option graph at the default node", () => inputTest("debug commence numbers", "one", "two", "three"));
  it("commences an option graph at the specified node", () =>
    inputTest("debug commence numbers 3", "three", "one", "two"));
  it("shows a warning if the option graph doesn't exist", () =>
    inputTest("debug show graph letters", ["no option graph with ID", "letters"]));
  it("shows a warning if the node doesn't exist", () =>
    inputTest("debug commence numbers 4", ["Unable to find option graph and node", "4"]));
  it("shows a warning if the option graph and node combination doesn't exist", () =>
    inputTest("debug commence letters 2", ["Unable to find option graph and node", "letters 2"]));
  it("allows cloned items to be taken", async () => {
    await inputTest("debug spawn red ball", "Spawned red ball in Hall");
    await inputTest("take red ball", "the red ball");
    return inputTest("i", "You're carrying a red ball");
  });
  it("doesn't allow new items to be spawned", () =>
    inputTest("debug spawn monkey paw", 'No item with the name "monkey paw" found to clone.'));
  it("sets and retrieves persistent variables", async () => {
    await inputTest("debug variable store playerName Rich", "Variable stored.");
    return inputTest("debug variable retrieve playerName", "playerName: Rich");
  });
  it("sets, updates and retrieves persistent variables", async () => {
    await inputTest("debug variable store playerName Rich", "Variable stored.");
    await inputTest("debug variable update playerName Ted", "Variable updated.");
    return inputTest("debug variable retrieve playerName", "playerName: Ted");
  });
  it("forget persistent variables", async () => {
    await inputTest("debug variable store playerName Rich", "Variable stored.");
    await inputTest("debug variable forget playerName", "Variable forgotten.");
    return inputTest("debug variable retrieve playerName", "playerName: undefined");
  });
});
