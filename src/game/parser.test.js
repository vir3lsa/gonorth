import Room from "./room";
import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import { newGame } from "../redux/gameActions";
import { parsePlayerInput } from "./parser";
import Game from "./game";

initStore();

let game;
const hall = new Room("Hall", "");
const north = new Room("Garden", "");
const south = new Room("Kitchen", "");
const east = new Room("Scullery", "");
const west = new Room("Pantry", "");

hall.setNorth(north);
hall.setSouth(south);
hall.setEast(east);
hall.setWest(west);

describe("parser", () => {
  describe("directions", () => {
    beforeEach(() => {
      game = new Game("The Giant's Castle");
      getStore().dispatch(newGame(game, true));
      game.room = hall;
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
  });
});
