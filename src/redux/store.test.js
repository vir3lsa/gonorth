import { goToRoom, initGame, Item, Room } from "../gonorth";
import { handleTurnEnd } from "../utils/lifecycle";
import { changeRoom, newGame, recordChanges } from "./gameActions";
import { initStore } from "./store";
import { getPersistor, getStore, unregisterStore } from "./storeRegistry";

jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let persistor;
let mockStorage;
let result;
let vase;

beforeEach(() => {
  mockStorage = {};
  global.localStorage = { getItem: (key) => mockStorage[key], setItem: (key, value) => (mockStorage[key] = value) };
  unregisterStore();
  initStore();
  getStore().dispatch(newGame(initGame("test", "", { debugMode: false }), true, false));
  const room = new Room("Hydroponics");
  getStore().dispatch(changeRoom(room));
  persistor = getPersistor();

  vase = new Item("vase", "green", true);
  room.addItems(vase);

  goToRoom(room);
});

describe("basic persistor tests", () => {
  beforeEach(() => {
    persistor.persistSnapshot();
    result = JSON.parse(localStorage.getItem(persistor.key));
  });

  it("serializes the game turn", () => {
    expect(result.turn).toBe(1);
  });

  it("serializes item names the player has encountered", () => {
    expect(result.itemNames).toInclude("hydroponics");
    expect(result.itemNames).toInclude("room");
    expect(result.itemNames).toInclude("vase");
  });

  it("serializes the current room", () => {
    expect(result.room).toBe("hydroponics");
  });

  it("serializes all changed items - nothing initially", () => {
    expect(Object.keys(result.allItems).length).toBe(0);
  });
});

describe("changing items", () => {
  const otherRoom = new Room("Forest");

  beforeEach(() => {
    getStore().dispatch(recordChanges());
  });

  const persistSnapshotGetResult = () => {
    persistor.persistSnapshot();
    result = JSON.parse(localStorage.getItem(persistor.key));
  };

  it("serializes changed items", () => {
    vase.description = "cracked";
    persistSnapshotGetResult();
    expect(Object.keys(result.allItems).length).toBe(1);
    expect(Object.keys(result.allItems)[0]).toBe("vase");
    expect(result.allItems.vase).toEqual({ description: "cracked" });
  });

  it("serializes references to items by name", () => {
    otherRoom.addItem(vase); // Causes vase's container to change.
    persistSnapshotGetResult();
    expect(result.allItems.vase.container).toEqual({ isItem: true, name: "Forest" });
  });
});

describe("deserializing snapshots", () => {
  let otherRoom;

  beforeEach(() => {
    otherRoom = new Room("Garden");
    otherRoom.addItems(new Item("ornament"));
    getStore().dispatch(recordChanges());
  });

  const persistSnapshotAndLoad = () => {
    persistor.persistSnapshot();
    return persistor.loadSnapshot();
  };

  it("loads the game turn", async () => {
    await handleTurnEnd();
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.turn).toBe(2);
  });

  it("loads all items the player has seen", () => {
    goToRoom(otherRoom);
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.itemNames).toEqual(new Set(["hydroponics", "floor", "room", "vase", "garden", "ornament"]));
  });

  it("loads the current room as an actual room", () => {
    goToRoom(otherRoom);
    const snapshot = persistSnapshotAndLoad();
    expect(Object.is(snapshot.room, otherRoom)).toBe(true);
  });

  it("loads basic changes to items in full item list", () => {
    vase.size = 5;
    const snapshot = persistSnapshotAndLoad();
    expect([...snapshot.allItems]).toHaveLength(6);

    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(revivedVase.size).toBe(5);
    expect(Object.is(revivedVase, vase)).toBe(true);
  });

  it("loads advanced changes to items in full item list", () => {
    otherRoom.addItem(vase);
    const snapshot = persistSnapshotAndLoad();
    expect([...snapshot.allItems]).toHaveLength(6);

    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(Object.is(revivedVase.container, otherRoom)).toBe(true);
    expect(Object.is(revivedVase, vase)).toBe(true);
  });
});
