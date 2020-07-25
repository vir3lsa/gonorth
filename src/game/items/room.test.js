import { getStore } from "../../redux/storeRegistry";
import { Room } from "./room";
import { newGame, changeInteraction } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import { Item } from "./item";
import { initGame } from "../../gonorth";
import { Parser } from "../parser";

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

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

// Prevent console logging
getStore().dispatch(newGame(initGame("test", false), true, false));

const clickNext = () =>
  getStore()
    .getState()
    .game.interaction.options[0].action();

const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;

const selectInteraction = () => getStore().getState().game.interaction;

const clickNextAndWait = () => {
  clickNext();
  return selectInteraction().promise;
};

let hall, north, south, east, west;

beforeEach(() => {
  hall = new Room("Hall", "");
  north = new Room("Garden", "");
  south = new Room("Kitchen", "");
  east = new Room("Scullery", "");
  west = new Room("Pantry", "the pantry");
  getStore().dispatch(changeInteraction(new Interaction("")));
});

describe("Room", () => {
  describe("description", () => {
    it("prints item room listing", () => {
      const item = new Item("candlestick", "ornate silver");
      item.containerListing =
        "There's an ornate silver candle holder on a side table";
      hall.addItem(item);
      expect(hall.itemListings).toInclude(item.containerListing);
    });

    it("lists holdable items with no room listing", () => {
      const item1 = new Item("candlestick", "", true);
      const item2 = new Item("bread maker", "", true);
      hall.addItems(item1, item2);
      expect(hall.itemListings).toInclude("a candlestick and a bread maker");
    });

    it("lists items contained by other items", () => {
      const item1 = new Item("candlestick", "", true);
      const item2 = new Item("apple", "", true);
      const table = new Item("table", "");
      table.preposition = "on";
      table.capacity = 10;
      table.itemsVisibleFromRoom = true;
      table.addItems(item1, item2);
      hall.addItem(table);
      expect(hall.itemListings).toInclude(
        "On the table there's a candlestick and an apple."
      );
    });

    it("does not list items contained by other items when not visible", () => {
      const item1 = new Item("candlestick", "", true);
      const table = new Item("table", "");
      table.preposition = "on";
      table.capacity = 10;
      table.itemsVisibleFromRoom = false;
      table.addItems(item1);
      hall.addItem(table);
      expect(hall.itemListings).toEqual("");
    });
  });

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
      expect(north.adjacentRooms.south.room.name).toBe("Hall");
    });

    it("sets South inverse", () => {
      hall.setSouth(south);
      expect(south.adjacentRooms.north.room.name).toBe("Hall");
    });

    it("sets East inverse", () => {
      hall.setEast(east);
      expect(east.adjacentRooms.west.room.name).toBe("Hall");
    });

    it("sets West inverse", () => {
      hall.setWest(west);
      expect(west.adjacentRooms.east.room.name).toBe("Hall");
    });
  });

  describe("changing rooms", () => {
    let game;

    beforeEach(() => {
      game = initGame("The Giant's Castle", false);
      getStore().dispatch(newGame(game, true));
      game.room = hall;
    });

    it("doesn't change room if not navigable as boolean", () => {
      hall.setNorth(north, false);
      new Parser("north").parse();
      expect(game.room.name).toBe("Hall");
    });

    it("doesn't change room if not navigable as function", () => {
      hall.setNorth(north, () => false);
      new Parser("north").parse();
      expect(game.room.name).toBe("Hall");
    });

    it("responds to custom directions", async () => {
      hall.addAdjacentRoom(east, "archway");
      const actionPromise = new Parser("archway").parse();
      getStore()
        .getState()
        .game.interaction.options[0].action();
      await actionPromise;
      expect(game.room.name).toBe("Scullery");
    });

    it("informs player when a direction doesn't exist", () => {
      new Parser("east").parse();
      expect(getStore().getState().game.interaction.currentPage).toBe(
        "You can't go that way."
      );
    });

    it("gives custom messages when a direction doesn't exist", () => {
      hall.setSouth(null, false, null, "You can't walk through walls");
      new Parser("south").parse();
      expect(getStore().getState().game.interaction.currentPage).toBe(
        "You can't walk through walls"
      );
    });

    it("prints a message when successfully going in a direction", () => {
      hall.setWest(new Room("Chapel"));
      new Parser("west").parse();
      expect(selectCurrentPage().includes("Going West.")).toBeTruthy();
    });

    it("prints new room text", async () => {
      hall.setWest(west);
      new Parser("west").parse();
      await clickNextAndWait();
      expect(selectCurrentPage()).toBe("the pantry");
    });
  });
});
