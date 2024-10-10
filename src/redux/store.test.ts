import {
  addEvent,
  addSchedule,
  Event,
  goToRoom,
  initGame,
  Item,
  OptionGraph,
  retrieve,
  Room,
  Schedule,
  store,
  TIMEOUT_MILLIS,
  update
} from "../gonorth";
import { handleTurnEnd } from "../utils/lifecycle";
import { moveItem } from "../utils/itemFunctions";
import { changeRoom, loadSnapshot, recordChanges } from "./gameActions";
import { getPersistor, getStore, unregisterStore } from "./storeRegistry";
import { SequentialText, RandomText, ManagedText } from "../game/interactions/text";
import { STATE_RUNNING } from "../game/events/schedule";

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
let transientOptionGraph: OptionGraphT;
let testEvent: Event;
let testSchedule: Schedule;

const setUpStoreTests = (additionalSetup?: () => void) => {
  unregisterStore();
  initGame("test", "", { debugMode: false }), true, false;
  room = new Room("Hydroponics");
  getStore().dispatch(changeRoom(room));
  persistor = getPersistor();
  optionGraph = new OptionGraph("test99", { id: "node1" });
  transientOptionGraph = new OptionGraph.Builder("transient").build();
  transientOptionGraph.persist = false;

  vase = new Item("vase", "green", true);
  vase.description = new RandomText("big", "small"); // Ensure changes to this are recorded.
  room.addItems(vase);

  testEvent = new Event.Builder("testEvent").build();
  testEvent.countdown = 7;
  testEvent.state = "TEST_STATE";
  addEvent(testEvent);

  testSchedule = new Schedule.Builder("testSchedule")
    .addEvents(new Event.Builder(), new Event.Builder(), new Event.Builder(), new Event.Builder())
    .build();
  testSchedule.stage = 3;
  testSchedule.state = "TEST_STATE";
  testSchedule.currentEvent.state = "TEST_STATE_2";
  testSchedule.currentEvent.countdown = 5;
  addSchedule(testSchedule);

  goToRoom(room);

  additionalSetup?.();
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

it("reveals no snapshot exists", () => {
  expect(persistor.hasSnapshot()).toBe(false);
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

  it("doesn't serialize non-persistent option graphs", () => {
    expect(result.optionGraphs.transient).toBeUndefined();
  });

  it("reveals whether a snapshot exists", () => {
    expect(persistor.hasSnapshot()).toBe(true);
  });

  it("seralizes events", () => {
    expect(result.events.testEvent.countdown).toBe(7);
    expect(result.events.testEvent.state).toBe("TEST_STATE");
  });

  it("seralizes schedules", () => {
    expect(result.schedules.testSchedule.stage).toBe(3);
    expect(result.schedules.testSchedule.state).toBe("TEST_STATE");
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
    expect(result.allItems.vase.container).toEqual({
      isItem: true,
      name: "Forest"
    });
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

  const persistSnapshotAndLoad = (additionalSetup?: () => void) => {
    persistor.persistSnapshot();

    // Reset everything to simulate starting a new session.
    setUpStoreTests(additionalSetup);
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
    optionGraph._recordCurrentNode(optionGraph.getNode("node1"));
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.optionGraphs.test99).toBeInstanceOf<typeof OptionGraph>(OptionGraph);
    expect(snapshot.optionGraphs.test99.currentNode.id).toBe("node1");
  });

  it("doesn't persist a non-resumable OptionGraph's current node", () => {
    optionGraph.resumable = false;
    optionGraph._recordCurrentNode(optionGraph.getNode("node1"));
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.optionGraphs.test99.currentNode).toBeUndefined();
  });

  it("handles a persisted option graph that's not in current state", () => {
    const grapho = new OptionGraph.Builder("grapho").withNodes(new OptionGraph.NodeBuilder("n1").build()).build();
    grapho.persist = true;
    grapho._recordCurrentNode(grapho.getNode("n1"));

    persistor.persistSnapshot();

    // Check the new OptionGraph was persisted as expected.
    expect(JSON.parse(mockStorage[persistor.key]).optionGraphs.grapho.currentNode).toBe("n1");

    // Reset everything to simulate starting a new session.
    setUpStoreTests();
    setUpDeserializationTests();

    const loadedSnapshot = persistor.loadSnapshot();

    // Check the new OptionGraph wasn't deserialised because it's not also in state.
    expect(loadedSnapshot.optionGraphs.grapho).toBeUndefined();
  });

  it("revives events", () => {
    testEvent.countdown = 9;
    testEvent.state = "TEXAS";
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.events[0].countdown).toBe(9);
    expect(snapshot.events[0].state).toBe("TEXAS");
  });

  it("leaves event countdown as undefined if necessary", () => {
    testEvent.state = "WISCONSIN";
    testEvent.countdown = undefined;
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.events[0].countdown).toBeUndefined();
    expect(snapshot.events[0].state).toBe("WISCONSIN");
  });

  it("revives schedules", () => {
    testSchedule.state = "WYOMING";
    const snapshot = persistSnapshotAndLoad();
    expect(snapshot.schedules[0].stage).toBe(3);
    expect(snapshot.schedules[0].state).toBe("WYOMING");
    expect(snapshot.schedules[0].currentEvent.state).toBe("TEST_STATE_2");
    expect(snapshot.schedules[0].currentEvent.countdown).toBe(5);
  });

  describe("event timeouts", () => {
    let snapshot: RevivedSnapshot;

    afterEach(() => {
      testEvent.cancel();
      snapshot?.events[0]?.cancel();
      testSchedule.cancel();
      snapshot?.schedules[0].cancel();
    });

    it("gives a revived event a new timeout ID", async () => {
      testEvent.timeoutType = TIMEOUT_MILLIS;
      testEvent.timeout = 10000; // Long enough not to complete.
      testEvent.commence();

      const timeoutIdBefore = testEvent.timeoutId;
      snapshot = persistSnapshotAndLoad(() => {
        testEvent.timeoutType = TIMEOUT_MILLIS;
        testEvent.timeout = 10000;
      });

      // When the event next ticks the timer restarts.
      await handleTurnEnd();
      const timeoutIdAfter = snapshot.events[0].timeoutId;

      expect(timeoutIdBefore).toBeDefined();
      expect(timeoutIdAfter).toBeDefined();
      expect(timeoutIdAfter).not.toEqual(timeoutIdBefore);
    });

    it("gives a revived schedule event a new timeout ID", async () => {
      testSchedule.state = STATE_RUNNING;
      const event = testSchedule.currentEvent;
      event.timeoutType = TIMEOUT_MILLIS;
      event.timeout = 10000; // Long enough not to complete.
      event.commence();

      const timeoutIdBefore = event.timeoutId;
      snapshot = persistSnapshotAndLoad(() => {
        const newEvent = testSchedule.currentEvent;
        newEvent.timeoutType = TIMEOUT_MILLIS;
        newEvent.timeout = 10000;
      });

      // When the event next ticks the timer restarts.
      await handleTurnEnd();
      const timeoutIdAfter = snapshot.schedules[0].currentEvent.timeoutId;

      expect(timeoutIdBefore).toBeDefined();
      expect(timeoutIdAfter).toBeDefined();
      expect(timeoutIdAfter).not.toEqual(timeoutIdBefore);
    });
  });
});
