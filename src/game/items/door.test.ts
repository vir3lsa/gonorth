import { changeInteraction, newGame, recordChanges } from "../../redux/gameActions";
import { Door, Key } from "./door";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Room } from "./room";
import { Interaction } from "../interactions/interaction";
import { goToRoom, initGame, selectRoom } from "../../gonorth";
import { Item } from "./item";
import { selectCurrentPage, selectInteraction } from "../../utils/testSelectors";
import { AnyAction } from "redux";
import { clickNext, clickNextAndWait, deferAction } from "../../utils/testFunctions";

let game: Game, room: RoomT, door: DoorT;

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();
  game = initGame("The Giant's Castle", "", { debugMode: false });
  getStore().dispatch(newGame(game, false));
  getStore().dispatch(changeInteraction(new Interaction("")) as AnyAction);
  room = new Room.Builder("Hall").build();
  room.setEast(new Room.Builder("Pantry").build());
  room.setWest(new Room.Builder("Cellar").build());
  door = new Door("heavy oak door", "", false, true);
  room.addItem(door);
  goToRoom(room);
});

test("doors can be unlocked", async () => {
  await door.try("unlock");
  expect(door.locked).toBe(false);
  expect(selectCurrentPage()).toInclude("unlocks with a soft *click*");
});

test("doors can only be unlocked once", async () => {
  await door.try("unlock");
  await door.try("unlock");
  expect(selectCurrentPage()).toInclude("already unlocked");
});

test("doors can't be opened when they're locked", async () => {
  await door.try("open");
  expect(door.open).toBe(false);
  expect(selectCurrentPage()).toInclude("is locked");
});

test("doors can be opened", async () => {
  await door.try("unlock");
  await door.try("open");
  expect(door.open).toBe(true);
  expect(selectCurrentPage()).toInclude("opens relatively easily");
});

test("doors can only be opened once", async () => {
  await door.try("unlock");
  await door.try("open");
  await door.try("open");
  expect(selectCurrentPage()).toInclude("already open");
});

test("doors can't be unlocked without a key if they require one", async () => {
  door.key = new Key("key");
  await door.try("unlock");
  expect(selectCurrentPage()).toInclude("appears to need a key");
});

test("doors can be unlocked with the correct key", async () => {
  door.key = new Key("key");
  await door.try("unlock", door.key);
  expect(selectCurrentPage()).toInclude("key turns easily");
});

test("doors can be unlocked with a cloned key", async () => {
  door.key = new Key("key");
  await door.try("unlock", door.key.clone());
  expect(selectCurrentPage()).toInclude("key turns easily");
});

test("doors can't be unlocked with the wrong key", async () => {
  door.key = new Key("key");
  await door.try("unlock", new Item("key2"));
  expect(selectCurrentPage()).toInclude("doesn't fit");
});

test("keys must be Key instances", () => {
  expect(() => (door.key = new Item("key"))).toThrow("Keys must be Key instances.");
});

test("shortcut function can be used to unlock doors", async () => {
  await door.tryUnlock();
  expect(door.locked).toBe(false);
  expect(selectCurrentPage()).toInclude("unlocks with a soft *click*");
});

test("shortcut function can be used to open doors", async () => {
  door.locked = false;
  await door.tryOpen();
  expect(door.open).toBe(true);
  expect(selectCurrentPage()).toInclude("opens relatively easily");
});

test("shortcut function can be used to close doors", async () => {
  door.open = true;
  await door.tryClose();
  expect(door.open).toBe(false);
  expect(selectCurrentPage()).toInclude("close the heavy oak door");
});

test("openSuccessText can be an Action", async () => {
  const hatch = new Door.Builder("hatch")
    .isOpen(false)
    .withOpenSuccessText(() => "It pops open")
    .build();
  await hatch.tryOpen();
  expect(selectCurrentPage()).toInclude("It pops open");
});

test("unlockSuccessText can be an Action", async () => {
  const hatch = new Door.Builder("hatch")
    .isLocked()
    .withUnlockSuccessText(() => "Click")
    .build();
  await hatch.tryUnlock();
  expect(selectCurrentPage()).toInclude("Click");
});

describe("Builder", () => {
  test("can be constructed using a builder", async () => {
    const door = new Door.Builder("iris")
      .withAliases("door")
      .withDescription("futuristic")
      .isLocked(false)
      .isOpen(false)
      .withOpenSuccessText("it irises open")
      .build();
    expect(door.name).toBe("iris");
    expect(door.aliases).toContain("door");
    expect(door.description).toBe("futuristic");
    expect(door.locked).toBe(false);
    expect(door.open).toBe(false);

    await door.tryOpen();
    expect(selectCurrentPage()).toInclude("it irises open");
  });

  test("verbs can be customised with the builder", async () => {
    const x = 0;
    const door = new Door.Builder("gate")
      .isOpen(false)
      .customiseVerb("open", (open) => open.addTest(() => x > 0, "x is zero"))
      .build();
    await door.tryOpen();
    expect(door.open).toBe(false);
    expect(selectCurrentPage()).toInclude("x is zero");
  });
});

describe("serialization", () => {
  beforeEach(() => {
    getStore().dispatch(recordChanges());
  });

  test("changes to open are recorded", () => {
    door.open = true;
    expect(door.alteredProperties).toEqual(new Set(["open"]));
  });

  test("changes to locked are recorded", () => {
    door.locked = true;
    expect(door.alteredProperties).toEqual(new Set(["locked"]));
  });

  test("changes to key are recorded", () => {
    door.key = new Key("slender key");
    expect(door.alteredProperties).toEqual(new Set(["key"]));
  });
});

describe("traversals", () => {
  let x: number;
  beforeEach(() => (x = 0));

  test("a traversal can be added to allow going through a door from an origin", async () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withTest(() => x > 0, "x too low")
          .onFailure("no traversal")
          .onSuccess("Well done")
          .withDestination("Pantry")
      )
      .build();
    room.addItem(gate);
    x = 1;
    gate.getVerb("go through").attempt(gate);
    await deferAction(() => expect(selectCurrentPage()).toInclude("Well done"));
    await clickNextAndWait();
    expect(selectRoom().name).toBe("Pantry");
  });

  test("multiple traversals can be added and the one whose activation condition matches will be chosen", async () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withActivationCondition(() => x < 0)
          .onSuccess("Well done")
          .withDestination("Pantry")
      )
      .addTraversal(
        new Door.TraversalBuilder()
          .withActivationCondition(() => x > 0)
          .onSuccess("You did it")
          .withDestination("Cellar")
      )
      .addTraversal(
        new Door.TraversalBuilder()
          .withActivationCondition(() => x === 0)
          .onSuccess("Wowee")
          .withDestination("Cellar")
      )
      .build();
    room.addItem(gate);
    x = 1;
    gate.getVerb("go through").attempt(gate);
    await deferAction(() => expect(selectCurrentPage()).toInclude("You did it"));
    await clickNextAndWait();
    expect(selectRoom().name).toBe("Cellar");
  });

  test("activation conditions can be booleans", async () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder().withActivationCondition(true).onSuccess("Success").withDestination("Pantry")
      )
      .build();
    room.addItem(gate);
    gate.getVerb("go through").attempt(gate);
    return deferAction(() => expect(selectCurrentPage()).toInclude("Success"));
  });

  test("an origin and an activation condition may be added", () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withActivationCondition(() => x > 0)
          .onSuccess("One")
          .withDestination("Pantry")
      )
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withActivationCondition(() => x < 0)
          .onSuccess("Two")
          .withDestination("Pantry")
      )
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Pantry")
          .withActivationCondition(() => x > 0)
          .onSuccess("Three")
          .withDestination("Hall")
      )
      .build();
    room.addItem(gate);
    x = -1;
    gate.getVerb("go through").attempt(gate);
    return deferAction(() => expect(selectCurrentPage()).toInclude("Two"));
  });

  test("an action may occur when a test fails", async () => {
    const gate = new Door.Builder("gate")
      .addTraversal(new Door.TraversalBuilder().withOrigin("Hall").withTest(false, "Nope").withDestination("Pantry"))
      .build();
    room.addItem(gate);
    gate.getVerb("go through").attempt(gate);
    await deferAction(() => expect(selectCurrentPage()).toInclude("Nope"));
    expect(selectInteraction().options).toBeUndefined();
  });

  test("an overall action may occur when tests fail", async () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withTest(false, "Nope")
          .onFailure("Bad")
          .withDestination("Pantry")
      )
      .build();
    room.addItem(gate);
    gate.getVerb("go through").attempt(gate);
    await deferAction(() => expect(selectCurrentPage()).toInclude("Nope"));
    await deferAction(() => expect(selectCurrentPage()).toInclude("Bad"));
    expect(selectInteraction().options).toBeUndefined();
  });

  test("an action may occur when a traversal succeeds", () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .onSuccess(() => (x = 12))
          .withDestination("Pantry")
      )
      .build();
    room.addItem(gate);
    gate.getVerb("go through").attempt(gate);
    return deferAction(() => expect(x).toBe(12));
  });

  test("throws error if neither origin nor activationCondition set", () => {
    const builder = new Door.TraversalBuilder().withDestination("Pantry");
    expect(() => builder.build()).toThrow("neither origin nor activationCondition were set");
  });

  test("throws error if no destination is set", () => {
    const builder = new Door.TraversalBuilder().withOrigin("Pantry");
    expect(() => builder.build()).toThrow("destination was not set");
  });

  test("traversals may have aliases", () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withAliases("swim", "bound")
          .withOrigin("Hall")
          .onSuccess("splash")
          .withDestination("Pantry")
      )
      .build();
    room.addItem(gate);
    gate.try("swim");
    return deferAction(() => expect(selectCurrentPage()).toInclude("splash"));
  });

  test("normal aliases may be used for a traversal with aliases", () => {
    const gate = new Door.Builder("gate")
      .addTraversal(
        new Door.TraversalBuilder()
          .withAliases("swim", "bound")
          .withOrigin("Hall")
          .onSuccess("splash")
          .withDestination("Pantry")
      )
      .build();
    room.addItem(gate);
    gate.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("splash"));
  });

  test("gives default response if no traversal matches the alias", () => {
    const portal = new Door.Builder("portal")
      .addTraversal(
        new Door.TraversalBuilder().withAliases("warp").withOrigin("Pantry").onSuccess("zap").withDestination("Hall")
      )
      .build();
    room.addItem(portal);
    portal.try("warp");
    return deferAction(() => expect(selectCurrentPage()).toInclude("You're not sure how to do that."));
  });

  test("gives default response if no traversal activation condition succeeds", () => {
    const archway = new Door.Builder("archway")
      .addTraversal(new Door.TraversalBuilder().withOrigin("Pantry").onSuccess("how grand").withDestination("Hall"))
      .build();
    room.addItem(archway);
    archway.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("You can't go that way."));
  });

  test("doors usually have to be open", () => {
    const doubleDoor = new Door.Builder("double door")
      .isOpen(false)
      .addTraversal(new Door.TraversalBuilder().withOrigin("Hall").withDestination("Pantry"))
      .build();
    room.addItem(doubleDoor);
    doubleDoor.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("The double door is closed"));
  });

  test("onClosed text can be overridden", () => {
    const singleDoor = new Door.Builder("single door")
      .isOpen(false)
      .addTraversal(new Door.TraversalBuilder().onDoorClosed("Ouch").withOrigin("Hall").withDestination("Pantry"))
      .build();
    room.addItem(singleDoor);
    singleDoor.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("Ouch"));
  });

  test("traversals may choose not to require the door to be open", () => {
    const bigDoor = new Door.Builder("big door")
      .isOpen(false)
      .addTraversal(
        new Door.TraversalBuilder()
          .requiresDoorOpen(false)
          .withOrigin("Hall")
          .withDestination("Pantry")
          .onSuccess("Hooray")
      )
      .build();
    room.addItem(bigDoor);
    bigDoor.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("Hooray"));
  });
});
