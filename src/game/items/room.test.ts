import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Room } from "./room";
import { changeInteraction, changeRoom, recordChanges } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import { Item } from "./item";
import gn, { SequentialText } from "../../gonorth";
import { Parser } from "../input/parser";
import { selectCurrentPage } from "../../utils/testSelectors";
import { clickNext, deferAction } from "../../utils/testFunctions";
import { selectItem, selectRoom } from "../../utils/selectors";
import { Door } from "./door";
import { AnyAction } from "redux";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let hall: RoomT, north: RoomT, south: RoomT, east: RoomT, west: RoomT, up: RoomT;

const initRooms = () => {
  hall = new Room.Builder("Hall").withDescription("").build();
  north = new Room.Builder("Garden").withDescription("").build();
  south = new Room.Builder("Kitchen").withDescription("").build();
  east = new Room.Builder("Scullery").withDescription("").build();
  west = new Room.Builder("Pantry").withDescription("the pantry").build();
  up = new Room.Builder("Belfry").withDescription(() => "the belfry").build();
};

beforeEach(() => {
  unregisterStore();
  gn.init({ title: "test", debugMode: false, goToTitleScreen: false });
  initRooms();
  getStore().dispatch(changeInteraction(new Interaction("")) as AnyAction);
});

describe("Room", () => {
  test("NPC aliases can be omitted", () => {
    const room = new Room.Builder("small study").withAliases("large study").omitAliases("small", "large").build();
    expect(room.aliases).toEqual(["study", "large study", "room", "floor"]);
    expect(selectItem("study")).toBeDefined();
    expect(selectItem("small")).toBeUndefined();
    expect(selectItem("large")).toBeUndefined();
  });

  test("NPC clone aliases are also omitted", () => {
    const room = new Room.Builder("small study").withAliases("large study").omitAliases("small", "large").build();
    expect(room.clone().aliases).toEqual(["study", "large study", "room", "floor"]);
    expect(selectItem("study")).toBeDefined();
    expect(selectItem("small")).toBeUndefined();
    expect(selectItem("large")).toBeUndefined();
  });

  describe("description", () => {
    it("prints item room listing", () => {
      const item = new Item("candlestick", "ornate silver");
      item.containerListing = "There's an ornate silver candle holder on a side table";
      hall.addItem(item);
      expect(hall.itemListings).toInclude(item.containerListing);
    });

    it("lists holdable items with no room listing", () => {
      const item1 = new Item("candlestick", "", true);
      const item2 = new Item("bread maker", "", true);
      hall.addItems(item1, item2);
      expect(hall.itemListings).toInclude("a candlestick and a bread maker");
    });

    it("does not list items with doNotList", () => {
      const item1 = new Item("candlestick", "", true);
      const item2 = new Item("bread maker", "", false);
      item1.doNotList = true;
      item2.doNotList = true;
      hall.addItems(item1, item2);
      expect(hall.itemListings).not.toInclude("a candlestick and a bread maker");
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
      expect(hall.itemListings).toInclude("On the table there's a candlestick and an apple.");
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
    it("sets north", () => {
      hall.setNorth(north);
      expect(hall.adjacentRooms.north.room?.name).toBe("Garden");
    });

    it("sets south", () => {
      hall.setSouth(south);
      expect(hall.adjacentRooms.south.room?.name).toBe("Kitchen");
    });

    it("sets east", () => {
      hall.setEast(east);
      expect(hall.adjacentRooms.east.room?.name).toBe("Scullery");
    });

    it("sets west", () => {
      hall.setWest(west);
      expect(hall.adjacentRooms.west.room?.name).toBe("Pantry");
    });

    it("sets north inverse", () => {
      hall.setNorth(north);
      expect(north.adjacentRooms.south.room?.name).toBe("Hall");
    });

    it("sets south inverse", () => {
      hall.setSouth(south);
      expect(south.adjacentRooms.north.room?.name).toBe("Hall");
    });

    it("sets east inverse", () => {
      hall.setEast(east);
      expect(east.adjacentRooms.west.room?.name).toBe("Hall");
    });

    it("sets west inverse", () => {
      hall.setWest(west);
      expect(west.adjacentRooms.east.room?.name).toBe("Hall");
    });
  });

  describe("changing rooms", () => {
    beforeEach(() => {
      unregisterStore();
      gn.init({ title: "The Giant's Castle", goToTitleScreen: false });
      initRooms();
      getStore().dispatch(changeRoom(hall));
      getStore().dispatch(changeInteraction(new Interaction("")) as AnyAction);
    });

    it("doesn't change room if not navigable as boolean", () => {
      hall.setNorth(north, false);
      new Parser("north").parse();
      expect(selectRoom().name).toBe("Hall");
    });

    it("doesn't change room if not navigable as function", () => {
      hall.setNorth(north, () => false);
      new Parser("north").parse();
      expect(selectRoom().name).toBe("Hall");
    });

    it("responds to custom directions", async () => {
      hall.addAdjacentRoom(east, "archway");
      setTimeout(() => clickNext());
      await new Parser("archway").parse();
      expect(selectRoom().name).toBe("Scullery");
    });

    it("informs player when a direction doesn't exist", async () => {
      await new Parser("east").parse();
      expect(selectCurrentPage()).toBe("You can't go that way.");
    });

    it("gives custom messages when a direction doesn't exist", async () => {
      hall.setSouth(undefined, false, null, "You can't walk through walls");
      await new Parser("south").parse();
      expect(selectCurrentPage()).toBe("You can't walk through walls");
    });

    it("refers to the door when it's closed", async () => {
      hall.setSouth(undefined, new Door("gate", "iron", false));
      await new Parser("south").parse();
      expect(selectCurrentPage()).toBe("The gate is closed.");
    });

    it("prints a message when successfully going in a direction", async () => {
      hall.setWest(new Room("Chapel"));
      new Parser("west").parse();
      return deferAction(() => expect(selectCurrentPage().includes("Going west.")).toBeTruthy());
    });

    it("prints new room text, clearing previous text", async () => {
      hall.setWest(west);
      setTimeout(() => clickNext());
      await new Parser("west").parse();
      expect(selectCurrentPage()).toBe("the pantry");
    });

    it("prints new room text, clearing previous text when room has description function", async () => {
      hall.setUp(up);
      setTimeout(() => clickNext());
      await new Parser("up").parse();
      expect(selectCurrentPage()).toBe("the belfry");
    });

    it("can have a Text object on direction failure", async () => {
      hall.setWest(undefined, false, undefined, new SequentialText("wall"));
      await new Parser("west").parse();
      expect(selectCurrentPage()).toInclude("wall");
    });

    it("can have a function on direction failure", async () => {
      hall.setWest(undefined, false, undefined, () => "wall func");
      await new Parser("west").parse();
      expect(selectCurrentPage()).toInclude("wall func");
    });

    it("can have multiple actions on direction failure", async () => {
      hall.setWest(undefined, false, undefined, ["one", () => "two"]);
      setTimeout(() => clickNext());
      await new Parser("west").parse();
      expect(selectCurrentPage()).toInclude("one");
      expect(selectCurrentPage()).toInclude("two");
    });
  });

  describe("serialization", () => {
    beforeEach(() => {
      getStore().dispatch(recordChanges());
    });

    it("records changes to adjacentRooms", () => {
      hall.adjacentRooms = {};
      expect(hall.alteredProperties).toEqual(new Set(["adjacentRooms"]));
    });

    it("records changes to checkpoint", () => {
      hall.checkpoint = true;
      expect(hall.alteredProperties).toEqual(new Set(["checkpoint"]));
    });
  });

  it("doesn't alter room capacity when adding and removing items", () => {
    const artifact = new Item.Builder("artifact").isHoldable().withSize(2).build();
    hall.addItem(artifact);
    expect(hall.capacity).toBe(-1);
    hall.removeItem(artifact);
    expect(hall.capacity).toBe(-1);
  });

  test("aliases may be omitted", () => {
    const largeRoom = new Room.Builder("very large room")
      .withAliases("really big space")
      .omitAliases("very", "really")
      .build();
    expect(largeRoom.aliases).toEqual(["large", "room", "big", "space", "really big space", "floor"]);
  });

  test("cloned aliases are also omitted", () => {
    const largeRoom = new Room.Builder("very large room")
      .withAliases("really big space")
      .omitAliases("very", "really")
      .build();
    expect(largeRoom.clone().aliases).toEqual(["large", "room", "big", "space", "really big space", "floor"]);
  });

  test("non-hidden items may be added via the builder", () => {
    const nursery = new Room.Builder("nursery")
      .hasItem(new Item.Builder("bride"))
      .hasItem(new Item.Builder("groom"))
      .hasItems(new Item.Builder("icing"), new Item.Builder("ribbon"))
      .build();
    expect(nursery.items.bride).toBeDefined();
    expect(nursery.items.groom).toBeDefined();
    expect(nursery.items.icing).toBeDefined();
    expect(nursery.items.ribbon).toBeDefined();
  });

  test("room action chains are consistent", () => {
    expect(hall.actionChain).toBe(hall.actionChain);
  });

  test("room action chain postscripts may change", () => {
    const original = hall.actionChain.postScript;
    hall.addItem(new Item.Builder("dog").isHoldable().build());
    const newPostscript = hall.actionChain.postScript;
    expect(newPostscript).not.toEqual(original);
    expect(newPostscript?.toString().includes("dog")).toBe(true);
  });
});
