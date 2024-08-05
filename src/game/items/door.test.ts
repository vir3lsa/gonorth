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
import { clearPage } from "../../utils/sharedFunctions";

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

test("doors can't be opened with a key when none is required", async () => {
  await door.tryUnlock(new Key("skeleton"));
  expect(selectCurrentPage()).toInclude("can't be unlocked with a key");
});

test("keys must be Key instances", () => {
  expect(() => (door.key = new Item("key"))).toThrow(
    "Keys must be Key instances."
  );
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

test("onCloseSuccess can be an Action", async () => {
  const fireDoor = new Door.Builder("fire door").onCloseSuccess(() => "Safety first.").build();
  await fireDoor.tryClose();
  expect(selectCurrentPage()).toInclude("Safety first.");
});

test("unlockSuccessText can be an Action", async () => {
  const hatch = new Door.Builder("hatch")
    .isLocked()
    .withUnlockSuccessText(() => "Click")
    .build();
  await hatch.tryUnlock();
  expect(selectCurrentPage()).toInclude("Click");
});

test("onLocked can be overridden", async () => {
  const grate = new Door.Builder("grate")
    .isLocked()
    .onLocked(() => "Doesn't budge")
    .build();
  await grate.tryOpen();
  expect(selectCurrentPage()).toInclude("Doesn't budge");
});

test("onNeedsKey can be overridden", async () => {
  const vault = new Door.Builder("vault")
    .isLocked()
    .withKey(new Key.Builder("key").build())
    .onNeedsKey(() => "Yeah right")
    .build();
  await vault.tryUnlock();
  expect(selectCurrentPage()).toInclude("Yeah right");
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

  test("aliases may be omitted", () => {
    const stairGate = new Door.Builder("stair gate")
      .withAliases("child proof door")
      .omitAliases("stair", "proof")
      .build();
    expect(stairGate.aliases).toEqual(["gate", "child", "door", "child proof door"]);
  });

  test("cloned aliases are also omitted", () => {
    const stairGate = new Door.Builder("stair gate")
      .withAliases("child proof door")
      .omitAliases("stair", "proof")
      .build();
    expect(stairGate.clone().aliases).toEqual(["gate", "child", "door", "child proof door"]);
  });

  test("doors may be always open", () => {
    const curtain = new Door.Builder("curtain").isAlwaysOpen().build();
    expect(curtain.verbs.open).toBeUndefined();
    expect(curtain.verbs.close).toBeUndefined();
    expect(curtain.verbs.unlock).toBeUndefined();
  });

  test("doors can't be always open and closed", () => {
    expect(() => new Door.Builder("hall").isAlwaysOpen().isOpen(false).build()).toThrow();
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
    x = -1;
    gate.getVerb("go through").attempt(gate);
    return deferAction(() => expect(selectCurrentPage()).toInclude("Two"));
  });

  test("an action may occur when a test fails", async () => {
    const gate = new Door.Builder("gate")
      .addTraversal(new Door.TraversalBuilder().withOrigin("Hall").withTest(false, "Nope").withDestination("Pantry"))
      .build();
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
    gate.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("splash"));
  });

  test("gives default response if no traversal matches the alias", () => {
    const portal = new Door.Builder("portal")
      .addTraversal(
        new Door.TraversalBuilder().withAliases("warp").withOrigin("Pantry").onSuccess("zap").withDestination("Hall")
      )
      .build();
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

  test("door open tests can be added with default text", () => {
    const doubleDoor = new Door.Builder("double door")
      .isOpen(false)
      .addTraversal(new Door.TraversalBuilder().withOrigin("Hall").withDestination("Pantry").withDoorOpenTest())
      .build();
    doubleDoor.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("The double door is closed"));
  });

  test("door open tests can be added with a custom onFailure action", () => {
    const singleDoor = new Door.Builder("single door")
      .isOpen(false)
      .addTraversal(new Door.TraversalBuilder().withDoorOpenTest("Ouch").withOrigin("Hall").withDestination("Pantry"))
      .build();
    singleDoor.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("Ouch"));
  });

  test("traversals may choose not to require the door to be open", () => {
    const bigDoor = new Door.Builder("big door")
      .isOpen(false)
      .addTraversal(new Door.TraversalBuilder().withOrigin("Hall").withDestination("Pantry").onSuccess("Hooray"))
      .build();
    bigDoor.try("go through");
    return deferAction(() => expect(selectCurrentPage()).toInclude("Hooray"));
  });

  test("traversals may include reversals", () => {
    const swingDoor = new Door.Builder("swing door")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withDestination("Pantry")
          .onSuccess(() => `From ${selectRoom().name}`),
        true
      )
      .build();
    goToRoom("Pantry");
    swingDoor.try("traverse");
    return deferAction(() => expect(selectCurrentPage()).toInclude("From Pantry"));
  });

  test("reversals include door open tests", () => {
    const swingDoor = new Door.Builder("swing door")
      .isOpen(false)
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withDestination("Pantry")
          .withDoorOpenTest(() => `Stuck in ${selectRoom().name}`)
          .onSuccess(() => `From ${selectRoom().name}`),
        true
      )
      .build();
    goToRoom("Pantry");
    swingDoor.try("traverse");
    return deferAction(() => expect(selectCurrentPage()).toInclude("Stuck in Pantry"));
  });

  test("reversals inherit aliases, tests, and onFailure", () => {
    const x = 0;
    const tunnel = new Door.Builder("tunnel")
      .addTraversal(
        new Door.TraversalBuilder()
          .withAliases("crawl")
          .withOrigin("Hall")
          .withDestination("Pantry")
          .withTest(() => x > 0, "x is zero")
          .onFailure("Global failure"),
        true
      )
      .build();
    goToRoom("Pantry");
    tunnel.try("crawl");
    return deferAction(() => {
      expect(selectCurrentPage()).toInclude("x is zero");
      expect(selectCurrentPage()).toInclude("Global failure");
    });
  });

  test("can peek through doors", async () => {
    const door = new Door.Builder("round door")
      .addTraversal(new Door.TraversalBuilder().withOrigin("Hall").withDestination("Pantry"))
      .build();
    await door.try("peek");
    expect(selectCurrentPage()).toInclude("Beyond the round door you can see the Pantry.");
  });

  test("doors must be open to peek through", async () => {
    const door = new Door.Builder("round door")
      .addTraversal(
        new Door.TraversalBuilder().withOrigin("Hall").withDestination("Pantry").withDoorOpenTest("door closed")
      )
      .isOpen(false)
      .build();
    await door.try("peek");
    expect(selectCurrentPage()).toInclude("door closed");
  });

  test("peeking has the same tests as going through and context is passed", async () => {
    const door = new Door.Builder("round door")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withDestination("Pantry")
          .withTest(false, (context) => `${context.verb?.name} no way`)
      )
      .build();
    await door.try("peek");
    expect(selectCurrentPage()).toInclude("peek no way");
  });

  test("peeking has the same activation conditions as going through", async () => {
    const door = new Door.Builder("round door")
      .addTraversal(
        new Door.TraversalBuilder().withOrigin("Hall").withDestination("Pantry").withActivationCondition(false)
      )
      .build();
    await door.try("peek");
    // No activation condition met.
    expect(selectCurrentPage()).toInclude("can't see beyond the round door");
  });

  test("can override default peek behaviour", async () => {
    const door = new Door.Builder("water door")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withDestination("Pantry")
          .onPeekSuccess(({ verb }) => `do the ${verb?.name}`)
      )
      .build();
    await door.try("peek");
    expect(selectCurrentPage()).toInclude("do the peek");
  });

  test("closed transparent doors may be peeked through", async () => {
    const door = new Door.Builder("closed door")
      .addTraversal(
        new Door.TraversalBuilder()
          .withOrigin("Hall")
          .withDestination("Pantry")
          .withDoorOpenTest("door closed")
          .onPeekSuccess("peek through glass")
      )
      .isOpen(false)
      .isTransparent()
      .build();
    await door.try("peek");
    expect(selectCurrentPage()).toInclude("peek through glass");
  });
});

test("correct plurality is used", async () => {
  const door = new Door.Builder("door").isOpen(false).isLocked().build();
  await door.try("open");
  expect(selectCurrentPage()).toBe("The door is locked.");
  await door.try("unlock");
  expect(selectCurrentPage()).toInclude("The door unlocks with a soft *click*");
  await door.try("close");
  expect(selectCurrentPage()).toInclude("The door is already closed.");
  await door.try("open");
  expect(selectCurrentPage()).toInclude("The door opens relatively easily.");
  await door.try("open");
  expect(selectCurrentPage()).toInclude("The door is already open.");
  await door.try("unlock");
  expect(selectCurrentPage()).toInclude("The door is already unlocked.");

  clearPage();
  const doors1 = new Door.Builder("doors").isOpen(false).isLocked().isPlural().build();
  await doors1.try("open");
  expect(selectCurrentPage()).toBe("The doors are locked.");
  await doors1.try("unlock");
  expect(selectCurrentPage()).toInclude("The doors unlock with a soft *click*");
  await doors1.try("close");
  expect(selectCurrentPage()).toInclude("The doors are already closed.");
  await doors1.try("open");
  expect(selectCurrentPage()).toInclude("The doors open relatively easily.");
  await doors1.try("open");
  expect(selectCurrentPage()).toInclude("The doors are already open.");
  await doors1.try("unlock");
  expect(selectCurrentPage()).toInclude("The doors are already unlocked.");
});