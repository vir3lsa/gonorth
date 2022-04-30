import { goToRoom, goToStartingRoom, initGame, Item, Room } from "../gonorth";
import { changeRoom, newGame, recordChanges } from "./gameActions";
import { initStore } from "./store";
import { getPersistor, getStore, unregisterStore } from "./storeRegistry";

jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

// Prevent console logging
getStore().dispatch(newGame(initGame("test", "", { debugMode: false }), true, false));

let persistor;
let mockStorage;
let result;
let vase;

describe("basic persistor tests", () => {
  beforeEach(() => {
    mockStorage = {};
    global.localStorage = { getItem: (key) => mockStorage[key], setItem: (key, value) => (mockStorage[key] = value) };
    unregisterStore();
    initStore();
    const room = new Room("Hydroponics");
    getStore().dispatch(changeRoom(room));
    persistor = getPersistor();

    vase = new Item("vase", "green", true);
    room.addItems(vase);

    goToRoom(room);
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
