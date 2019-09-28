import { store } from "../redux/store";
import Room from "./room";
import Game from "./game";
import { newGame } from "../redux/gameActions";

const hall = new Room("Hall");
const north = new Room("Garden");
const south = new Room("Kitchen");
const east = new Room("Scullery");
const west = new Room("Pantry");

describe("Room", () => {
  describe("adjacent rooms", () => {
    it("sets North", () => {
      hall.setNorth(north);
      expect(hall.adjacentRooms.north.room.name).toBe("Garden");
    });

    it("sets South", () => {
      hall.setSouth(south);
      expect(hall.adjacentRooms.south.room.name).toBe("Kitchen");
    });

    it("sets East", () => {
      hall.setEast(east);
      expect(hall.adjacentRooms.east.room.name).toBe("Scullery");
    });

    it("sets West", () => {
      hall.setWest(west);
      expect(hall.adjacentRooms.west.room.name).toBe("Pantry");
    });

    it("sets North inverse", () => {
      hall.setNorth(north);
      expect(hall.adjacentRooms.south.room.name).toBe("Kitchen");
    });

    it("sets South inverse", () => {
      hall.setSouth(south);
      expect(hall.adjacentRooms.north.room.name).toBe("Garden");
    });

    it("sets East inverse", () => {
      hall.setEast(east);
      expect(hall.adjacentRooms.west.room.name).toBe("Pantry");
    });

    it("sets West inverse", () => {
      hall.setWest(west);
      expect(hall.adjacentRooms.east.room.name).toBe("Scullery");
    });
  });

  describe("changing rooms", () => {
    let game;

    beforeEach(() => {
      game = new Game("The Giant's Castle");
      store.dispatch(newGame(game, true));
      game.room = hall;
    });

    it("doesn't change room if not navigable as boolean", () => {
      hall.setNorth(north, false);
      hall.go("north");
      expect(game.room.name).toBe("Hall");
    });

    it("doesn't change room if not navigable as function", () => {
      hall.setNorth(north, () => false);
      hall.go("north");
      expect(game.room.name).toBe("Hall");
    });
  });
});
