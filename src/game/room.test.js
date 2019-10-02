import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import { Room } from "./room";
import Game from "./game";
import { newGame } from "../redux/gameActions";

initStore();

const hall = new Room("Hall", "This is not happening");
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
      getStore().dispatch(newGame(game, true));
      game.room = hall;
    });

    it("doesn't change room if not navigable as boolean", () => {
      hall.setNorth(north, false);
      hall.try("north");
      expect(game.room.name).toBe("Hall");
    });

    it("doesn't change room if not navigable as function", () => {
      hall.setNorth(north, () => false);
      hall.try("north");
      expect(game.room.name).toBe("Hall");
    });

    it("responds to custom directions", () => {
      hall.addAdjacentRoom(east, "archway");
      hall.try("archway");
      expect(game.room.name).toBe("Scullery");
    });

    it("informs player when a direction doesn't exist", () => {
      hall.try("east");
      expect(getStore().getState().game.interaction.currentPage).toBe(
        "There's nowhere to go that way."
      );
    });

    it("gives custom messages when a direction doesn't exist", () => {
      hall.setSouth(null, false, "You can't walk through walls");
      hall.try("south");
      expect(getStore().getState().game.interaction.currentPage).toBe(
        "You can't walk through walls"
      );
    });

    it("prints a message when successfully going in a direction", () => {
      hall.setWest(new Room("Chapel"));
      hall.try("west");
      expect(getStore().getState().game.interaction.currentPage).toBe(
        "Going west."
      );
    });
  });
});
