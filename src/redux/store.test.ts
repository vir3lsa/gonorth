import { goToRoom, initGame, Item, OptionGraph, retrieve, Room, store, update } from "../gonorth";
import { handleTurnEnd } from "../utils/lifecycle";
import { moveItem } from "../utils/itemFunctions";
import { changeRoom, loadSnapshot, recordChanges } from "./gameActions";
import { getPersistor, getStore, unregisterStore } from "./storeRegistry";
import { SequentialText, RandomText, ManagedText } from "../game/interactions/text";

jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let persistor: SnaphotPersistorT;
let mockStorage: { [key: string]: string };
let result: Snapshot;
let vase: ItemT;
let room: RoomT;
let optionGraph: OptionGraphT;

const setUpStoreTests = () => {
  unregisterStore();
  initGame("test", "", { debugMode: false }), true, false;
  room = new Room("Hydroponics");
  getStore().dispatch(changeRoom(room));
  persistor = getPersistor();
  optionGraph = new OptionGraph("test99", { id: "node1" });

  vase = new Item("vase", "green", true);
  vase.description = new RandomText("big", "small"); // Ensure changes to this are recorded.
  room.addItems(vase);

  goToRoom(room);
};

beforeEach(() => {
  mockStorage = {};
  global.localStorage = {
    getItem: (key) => mockStorage[key],
    setItem: (key, value) => (mockStorage[key] = value),
    length: 0,
    clear: () => {},
    key: () => "",
    removeItem: () => {}
  };
  setUpStoreTests();
});

describe("basic persistor tests", () => {
  beforeEach(() => {
    persistor.persistSnapshot();
    const serialized = localStorage.getItem(persistor.key);
    result = JSON.parse(serialized || "");
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

  it("serializes option graphs", () => {
    expect(result.optionGraphs.test99).toEqual<SerializableOptionGraph>({});
  });
});

describe("changing items", () => {
  let otherRoom: RoomT, externalText: RandomText, externalManagedText: ManagedTextT;

  beforeEach(() => {
    otherRoom = new Room("Forest");
    externalText = new RandomText("a", "b");
    externalManagedText = new ManagedText.Builder()
      .withText(new SequentialText("1", "2"))
      .withText(new RandomText("3", "4"))
      .build();
    getStore().dispatch(recordChanges());
  });

  const persistSnapshotGetResult = () => {
    persistor.persistSnapshot();
    const serialized = localStorage.getItem(persistor.key);
    result = JSON.parse(serialized || "");
  };

  it("serializes changed items", () => {
    vase.description = "cracked";
    persistSnapshotGetResult();
    expect(Object.keys(result.allItems).length).toBe(1);
    expect(Object.keys(result.allItems)[0]).toBe("vase");
    expect((result.allItems as Dict).vase).toEqual({ description: "cracked" });
  });

  it("serializes references to items by name", () => {
    otherRoom.addItem(vase); // Causes vase's container to change.
    persistSnapshotGetResult();
    expect(result.allItems.vase.container).toEqual({ isItem: true, name: "Forest" });
  });

  it("completely serializes changes to Text fields", () => {
    vase.description = new SequentialText("one", "two");
    persistSnapshotGetResult();
    expect(result.allItems.vase.description.isText).toBe(true);
    expect(result.allItems.vase.description.partial).toBe(false);
    expect(result.allItems.vase.description.texts).toEqual(["one", "two"]);
  });

  it("serializes partial changes to Texts", () => {
    (vase.description as RandomTextT).next();
    persistSnapshotGetResult();
    expect(result.allItems.vase).toBeDefined();
    expect(result.allItems.vase.description).toBeDefined();
    expect(result.allItems.vase.description.isText).toBe(true);
    expect(result.allItems.vase.description.partial).toBe(true);
    expect(result.allItems.vase.description.candidates.length).toBe(1);
  });

  it("serializes external Texts in full when they've been set on an Item field during recording", () => {
    vase.description = externalText;
    persistSnapshotGetResult();
    expect(result.allItems.vase.description).toBeDefined();
    expect(result.allItems.vase.description.isText).toBe(true);
    expect(result.allItems.vase.description.partial).toBe(false);
    expect(result.allItems.vase.description.texts).toEqual(["a", "b"]);
  });

  it("serializes external ManagedTexts in full when they've been set on an Item field during recording", () => {
    vase.description = externalManagedText;
    persistSnapshotGetResult();
    expect(result.allItems.vase.description.isText).toBe(true);
    expect(result.allItems.vase.description.phaseNum).toBe(0);
    expect(result.allItems.vase.description.phases.length).toBe(2);
    expect(result.allItems.vase.description.phases[0].text.texts).toEqual(["1", "2"]);
    expect(result.allItems.vase.description.phases[1].text.texts).toEqual(["3", "4"]);
  });
});

describe("deserializing snapshots", () => {
  let otherRoom: RoomT, externalText: RandomText, externalManagedText: ManagedTextT;

  const setUpDeserializationTests = () => {
    otherRoom = new Room("Garden");
    otherRoom.addItems(new Item("ornament"));
    externalText = new RandomText("a", "b");
    externalManagedText = new ManagedText.Builder()
      .withText(new SequentialText("1", "2"))
      .withText(new RandomText("3", "4"))
      .build();
    getStore().dispatch(recordChanges());
  };

  beforeEach(() => {
    setUpDeserializationTests();
  });

  const persistSnapshotAndLoad = () => {
    persistor.persistSnapshot();

    // Reset everything to simulate starting a new session.
    setUpStoreTests();
    setUpDeserializationTests();

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

  it("recreates Texts in full where they've been created during recording", () => {
    vase.description = new SequentialText("lovely", "pretty");
    vase.description.next();
    const snapshot = persistSnapshotAndLoad();
    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(revivedVase.description instanceof SequentialText).toBe(true);
    expect(revivedVase.description.texts).toEqual(["lovely", "pretty"]);
    expect(revivedVase.description.index).toBe(0);
  });

  it("udpates Text fields changed during recording", () => {
    (vase.description as RandomText).next();
    const snapshot = persistSnapshotAndLoad();
    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(revivedVase.description instanceof RandomText).toBe(true);
    expect(revivedVase.description.candidates.length).toBe(1);
  });

  it("deserializes external Texts in full when they've been set on an Item field during recording", () => {
    vase.description = externalText;
    const snapshot = persistSnapshotAndLoad();
    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(revivedVase.description instanceof RandomText).toBe(true);
    expect(revivedVase.description.isText).toBe(true);
    expect(revivedVase.description.partial).toBe(false);
    expect(revivedVase.description.texts).toEqual(["a", "b"]);
  });

  it("deserializes external ManagedTexts in full when they've been set on an Item field during recording", () => {
    vase.description = externalManagedText;
    const snapshot = persistSnapshotAndLoad();
    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(revivedVase.description instanceof ManagedText).toBe(true);
    expect(revivedVase.description.isText).toBe(true);
    expect(revivedVase.description.partial).toBe(false);
    expect(revivedVase.description.phases.length).toBe(2);
    expect(revivedVase.description.phases[0].text.texts).toEqual(["1", "2"]);
    expect(revivedVase.description.phases[1].text.texts).toEqual(["3", "4"]);
  });

  const customStateTest = (propertyName: string, value: PersistentVariable) => {
    store(propertyName, value);
    const snapshot = persistSnapshotAndLoad();
    getStore().dispatch(loadSnapshot(snapshot));
    expect(retrieve(propertyName)).toEqual(value);
  };

  const updateCustomStateTest = (propertyName: string, value1: PersistentVariable, value2: PersistentVariable) => {
    store(propertyName, value1);
    update(propertyName, value2);
    const snapshot = persistSnapshotAndLoad();
    getStore().dispatch(loadSnapshot(snapshot));
    expect(retrieve(propertyName)).toEqual(value2);
  };

  it("deserializes custom string properties", () => customStateTest("fruit", "apple"));
  it("deserializes custom number properties", () => customStateTest("maths", 3));
  it("deserializes custom array properties", () => customStateTest("list", ["a", 2, ["c"]]));
  it("deserializes custom object properties", () => customStateTest("thing", { cat: "dog", bat: 4 }));

  it("deserializes updated custom string properties", () => updateCustomStateTest("animal", "badger", "tortoise"));
  it("deserializes updated custom number properties", () => updateCustomStateTest("maths", 3, 5));
  it("deserializes updated custom array properties", () => updateCustomStateTest("list", ["a", 2, ["c"]], ["c", 3]));
  it("deserializes updated custom object properties", () =>
    updateCustomStateTest("thing", { cat: "dog", bat: 4 }, { bird: "goose" }));

  it("throws an error if the same property is stored twice", () => {
    store("blood", "red");
    expect(() => store("blood", "blue")).toThrow();
  });

  it("throws an error if a property that doesn't exist is updated", () => {
    expect(() => update("cheese", "stilton")).toThrow();
  });

  it("moves moved items to their new containers", () => {
    moveItem(vase, otherRoom);
    const snapshot = persistSnapshotAndLoad();
    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(Object.is(revivedVase.container, otherRoom)).toBe(true);
    expect(room.items.vase).toBeUndefined();
    expect(otherRoom.items.vase).toBeDefined();
  });

  it("revives custom properties on items", () => {
    vase.set("origin", "egyptian");
    vase.set("circumference", 20);
    const snapshot = persistSnapshotAndLoad();
    const revivedVase = [...snapshot.allItems].find((item) => item.name === "vase");
    expect(revivedVase.get("origin")).toBe("egyptian");
    expect(revivedVase.get("circumference")).toBe(20);

    // Check the revived Item still recognises the custom properties have changed.
    expect(revivedVase._alteredProperties.has("properties")).toBe(true);
  });

  it("revives option graphs to their previous state", () => {
    optionGraph.currentNode = optionGraph.getNode("node1");
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.optionGraphs.test99).toBeInstanceOf<typeof OptionGraph>(OptionGraph);
    expect(snapshot.optionGraphs.test99.currentNode.id).toBe("node1");
  });
});
