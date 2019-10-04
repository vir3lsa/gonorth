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

describe("parser", () => {
  describe("directions", () => {
    beforeEach(() => {
      game = new Game("The Giant's Castle");
      getStore().dispatch(newGame(game, true));
      game.room = hall;
      door.open = false;
    });

    it("goes North", () => {
      parsePlayerInput("North");
      expect(game.room.name).toBe("Garden");
    });

    it("goes South", () => {
      parsePlayerInput("South");
      expect(game.room.name).toBe("Kitchen");
    });

    it("goes East", () => {
      parsePlayerInput("East");
      expect(game.room.name).toBe("Scullery");
    });

    it("goes West", () => {
      parsePlayerInput("West");
      expect(game.room.name).toBe("Pantry");
    });

    it("ignores case", () => {
      parsePlayerInput("NORTH");
      expect(game.room.name).toBe("Garden");
    });

    it("responds to alias", () => {
      parsePlayerInput("forward");
      expect(game.room.name).toBe("Garden");
    });

    it("responds to another alias", () => {
      parsePlayerInput("left");
      expect(game.room.name).toBe("Pantry");
    });

    it("responds to an item alias", () => {
      parsePlayerInput("open hatch");
      expect(door.open).toBe(true);
    });

    it("responds when the direction verb is the second word", () => {
      parsePlayerInput("go north");
      expect(game.room.name).toBe("Garden");
    });

    it("responds when the direction verb is the third word", () => {
      parsePlayerInput("now go north");
      expect(game.room.name).toBe("Garden");
    });

    it("responds when there are words between verb and item", () => {
      parsePlayerInput("now open the heavy trap door");
      expect(door.open).toBe(true);
    });

    it("responds to multi-word verbs", () => {
      parsePlayerInput("now give a shove to the trapdoor");
      expect(door.open).toBe(true);
    });
  });
});
