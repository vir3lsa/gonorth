import Room from "./room";
import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import { newGame } from "../redux/gameActions";
import { parsePlayerInput } from "./parser";
import Game from "./game";
import Door from "./door";

initStore();

let game;
const hall = new Room("Hall", "");
const north = new Room("Garden", "");
const south = new Room("Kitchen", "");
const east = new Room("Scullery", "");
const west = new Room("Pantry", "");
const door = new Door("trapdoor", "", false);
door.aliases = ["hatch", "trap door"];
door.getVerb("open").addAliases("give a shove to");

hall.setNorth(north);
hall.setSouth(south);
hall.setEast(east);
hall.setWest(west);
hall.addItem(door);

const directionTest = (input, expectedRoom) => {
  parsePlayerInput(input);
  // Choose "Next"
  getStore()
    .getState()
    .game.interaction.options[0].action();
  expect(game.room.name).toBe(expectedRoom);
};

const openDoorTest = input => {
  parsePlayerInput(input);
  expect(door.open).toBe(true);
};

describe("parser", () => {
  describe("directions", () => {
    beforeEach(() => {
      game = new Game("The Giant's Castle");
      getStore().dispatch(newGame(game, true));
      game.room = hall;
      door.open = false;
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
  });
});
