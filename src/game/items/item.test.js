import { Item, newItem } from "./item";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { SequentialText } from "../interactions/text";
import { newGame, recordChanges } from "../../redux/gameActions";
import { selectInventory, selectInventoryItems } from "../../utils/selectors";
import { Room } from "./room";
import { initGame, setInventoryCapacity, goToRoom } from "../../gonorth";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { Container } from "./container";
import { Verb } from "../../../src/game/verbs/verb";
import { clickNextAndWait } from "../../utils/testFunctions";

let game, room;

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", "", { debugMode: false });
  room = new Room("red");
  getStore().dispatch(newGame(game, true, false));
  goToRoom(room);
});

describe("basic item tests", () => {
  test("items can have variable descriptions", () => {
    let looks = 0;
    const clock = new Item("clock", (item) => {
      looks++;
      if (looks === 1) {
        return "It's 12 o'clock";
      } else if (looks === 2) {
        return "It's 1 o'clock";
      }
    });

    expect(clock.description).toBe("It's 12 o'clock");
    expect(clock.description).toBe("It's 1 o'clock");
  });

  it("Doesn't render a Next button for cyclic descriptions", () => {
    const table = new Item("table", ["It's made of wood.", "It has four legs."]);
    table.try("x");
    expect(selectOptions()).toBeNull();
  });

  it("renders each page of sequential text then stops", async () => {
    const chair = new Item("chair", new SequentialText("a", "b"));
    chair.try("x");
    const clickNextPromise = new Promise((resolve) =>
      setTimeout(async () => {
        await clickNextAndWait();
        resolve();
      })
    );
    expect(selectOptions()).toBeNull();
    return clickNextPromise;
  });

  test("items can be picked up", async () => {
    const watch = new Item("watch", "posh-looking", true, 1);
    room.addItem(watch);
    await watch.try("take");
    expect(selectInventory().items.watch[0].name).toBe("watch");
  });

  test("items can't be picked up if they're bigger than the inventory", async () => {
    setInventoryCapacity(5);
    const medicineBall = new Item("medicine ball", "big", true, 6);
    room.addItem(medicineBall);
    await medicineBall.try("take");
    expect(selectInventory().items["medicine ball"]).toBeUndefined();
    expect(selectCurrentPage()).toInclude("too big to pick up");
  });

  test("items can't be picked up if they're much bigger than the inventory", async () => {
    setInventoryCapacity(2);
    const medicineBall = new Item("medicine ball", "big", true, 6);
    room.addItem(medicineBall);
    await medicineBall.try("take");
    expect(selectInventory().items["medicine ball"]).toBeUndefined();
    expect(selectCurrentPage()).toInclude("far too large");
  });

  test("items can't be picked up if there's no room left", async () => {
    setInventoryCapacity(10);
    const medicineBall = new Item("medicine ball", "big", true, 6);
    const panda = new Item("panda", "black and white", true, 6);
    room.addItem(medicineBall);
    room.addItem(panda);
    await medicineBall.try("take");
    await panda.try("take");
    expect(selectInventory().items["medicine ball"]).not.toBeUndefined();
    expect(selectInventory().items.panda).toBeUndefined();
    expect(selectCurrentPage()).toInclude("don't have enough room");
  });

  test("items can't be picked up twice", async () => {
    const cup = new Item("cup", "little", true, 1);
    room.addItem(cup);
    await cup.try("take");
    await cup.try("take");
    expect(selectCurrentPage()).toInclude("already carrying");
  });

  test("items with no container may be taken programmatically", async () => {
    const dog = new Item.Builder("dog").isHoldable().build();
    await dog.try("take");
    expect(selectInventory().items["dog"]).not.toBeUndefined();
  });

  test("items may have custom take success text", async () => {
    const pipe = new Item.Builder("pipe").isHoldable().withTakeSuccessText("be careful").build();
    await pipe.try("take");
    expect(selectCurrentPage()).toInclude("be careful");
  });
});

describe("builder tests", () => {
  test("items can be built with a builder", () => {
    const pipe = new Item.Builder()
      .withName("pipe")
      .withDescription("This is not a pipe")
      .isHoldable()
      .withSize(1)
      .withAliases("pope")
      .withArticle("thy")
      .withTakeSuccessText("yoink")
      .build();
    expect(pipe.name).toBe("pipe");
    expect(pipe.description).toBe("This is not a pipe");
    expect(pipe.holdable).toBe(true);
    expect(pipe.size).toBe(1);
    expect(pipe.aliases).toInclude("pope");
    expect(pipe.article).toBe("thy");
    expect(pipe.takeSuccessText).toBe("yoink");
  });

  test("items built with a builder have the correct verbs", () => {
    const pipe = new Item.Builder().withName("pipe").isHoldable().withVerbs(new Verb("smoke")).build();
    expect(pipe.name).toBe("pipe");
    expect(pipe.holdable).toBe(true);
    expect(pipe.getVerb("examine")).not.toBeUndefined();
    expect(pipe.getVerb("take")).not.toBeUndefined();
    expect(pipe.getVerb("smoke")).not.toBeUndefined();
  });

  test("a helpful error message is provided when adding an item if build() is not called", () => {
    expect(() => room.addItem(new Item.Builder().withName("unfinished"))).toThrow("forget to call build()?");
  });

  test("a helpful error message is provided when adding a verb if build() is not called", () => {
    expect(() => room.addVerb(new Verb.Builder().withName("unfinished"))).toThrow("forget to call build()?");
  });
});

describe("putting items", () => {
  let ball, table, flowers;

  beforeEach(() => {
    ball = new Item("ball", "red", true, 1);
    table = new Item("table", "mahogany", false);
    flowers = new Item("flowers", "pretty", true);

    table.capacity = 10;
    table.preposition = "on";

    room.addItems(ball, table, flowers);
  });

  test("adds the item to the container", async () => {
    await ball.try("put", table);
    expect(table.items[ball.name][0]).toBe(ball);
  });

  test("removes the item from the room", async () => {
    expect(room.items[ball.name]).not.toBeUndefined();
    await ball.try("put", table);
    expect(room.items[ball.name]).toBeUndefined();
  });

  test("removes the item from the inventory", async () => {
    await ball.try("take");
    expect(selectInventory().items[ball.name]).not.toBeUndefined();
    await ball.try("put", table);
    expect(selectInventory().items[ball.name]).toBeUndefined();
  });

  test("uses the correct preposition", async () => {
    await ball.try("put", table);
    expect(selectCurrentPage()).toInclude("ball on the table");
  });

  test("uses a different preposition", async () => {
    table.preposition = "under";
    await ball.try("put", table);
    expect(selectCurrentPage().includes("ball under the table")).toBeTruthy();
  });

  test("fails if the indirect object isn't a container", async () => {
    await ball.try("put", flowers);
    expect(selectCurrentPage().includes("can't put the ball")).toBeTruthy();
  });

  test("fails if there's no room left in the container", async () => {
    table.capacity = 0;
    await ball.try("put", table);
    expect(selectCurrentPage().includes("no room on the table")).toBeTruthy();
  });

  test("fails if putting an object in itself", async () => {
    ball.capacity = 3;
    await ball.try("put", ball);
    expect(selectCurrentPage()).toInclude("nonsensical");
  });

  test("items can be created with config objects", () => {
    const item = newItem({ name: "Dave", description: "Man", holdable: false });
    expect(item.name).toBe("Dave");
    expect(item.description).toBe("Man");
    expect(item.holdable).toBe(false);
  });

  test("accessible items can share aliases", () => {
    room.addItems(new Item("cat"), new Item("dog"), newItem({ name: "black dog", aliases: ["dog"] }));
    const items = room.accessibleItems;
    expect(items["cat"].length).toBe(1);
    expect(items["dog"].length).toBe(2);
    expect(items["black dog"].length).toBe(1);
  });

  test("picks up the indirect item if it's holdable", async () => {
    const bag = new Container.Builder("bag").isHoldable().build();
    room.addItem(bag);
    await ball.try("put", bag);
    expect(selectInventoryItems()).toInclude(bag);
  });

  test("fails if the indirect item is holdable but can't be picked up", async () => {
    setInventoryCapacity(10);
    const bag = new Container.Builder("bag").isHoldable().withSize(20).build();
    room.addItem(bag);
    await ball.try("put", bag);
    expect(selectInventoryItems()).toInclude(ball);
    expect(selectInventoryItems()).not.toInclude(bag);
  });
});

describe("aliases", () => {
  test("item name is split into aliases", () => {
    const item = new Item("shiny pebble");
    expect(item.aliases).toEqual(["shiny", "pebble"]);
  });

  test("aliases are split into more aliases", () => {
    const item = new Item("stone", "", true, 1, [], ["shiny pebble", "gleaming rock"]);
    expect(item.aliases).toEqual(["shiny", "pebble", "shiny pebble", "gleaming", "rock", "gleaming rock"]);
  });

  test("aliases can be overridden", () => {
    const item = new Item("shiny pebble");
    item.aliases = ["red", "ball"];
    expect(item.aliases).toEqual(["red", "ball"]);
  });

  test("aliases can be added to", () => {
    const item = new Item("shiny pebble");
    item.addAliases("gleaming rock");
    expect(item.aliases).toEqual(["shiny", "pebble", "gleaming", "rock", "gleaming rock"]);
  });

  test("common words aren't added as aliases", () => {
    const item = new Item("The Lord of the Rings");
    expect(item.aliases).toEqual(["lord", "rings"]);
  });

  test("duplicate aliases aren't added", () => {
    const item = new Item("shiny pebble");
    item.addAliases("gleaming pebble");
    expect(item.aliases).toEqual(["shiny", "pebble", "gleaming", "gleaming pebble"]);
  });

  test("aliases initialised to empty array", () => {
    const item = new Item("watch");
    expect(item.aliases).toEqual([]);
  });

  test("aliases are compared to lower-case name", () => {
    const item = new Item("Cuthbert");
    item.addAliases("cuthbert");
    expect(item.aliases).toEqual([]);
  });
});

describe("containers", () => {
  let ball, chest;

  beforeEach(() => {
    ball = new Item("ball", "red", true, 1);
    chest = new Container("chest", null, "a large chest", "the lid is open", false);
    chest.addItem(ball);
    room.addItems(chest);
  });

  test("items can't be seen in closed containers", () => {
    expect(Object.keys(chest.accessibleItems)).not.toContain("ball");
  });

  test("items can be seen in open containers", async () => {
    await chest.try("open");
    expect(Object.keys(chest.accessibleItems)).toContain("ball");
    expect(chest.accessibleItems["ball"]).toContain(ball);
  });
});

describe("serialization", () => {
  let ball, chest, box;

  const expectRecordedProperties = (item, ...properties) => {
    expect(item._alteredProperties).toEqual(new Set([...properties]));
  };

  beforeEach(() => {
    ball = new Item("ball", "red", true, 1);
    chest = new Container("chest", null, "a large chest", "the lid is open", false);
    box = new Container("box", null, "a cardboard box", "tatty and brown", false);
  });

  describe("recording changes", () => {
    beforeEach(() => {
      getStore().dispatch(recordChanges());
    });

    test("initially no properties are considered altered", () => {
      expectRecordedProperties(ball);
    });

    test("name changes that produce alias changes are recorded", () => {
      ball.name = "red ball";
      expectRecordedProperties(ball, "name", "aliases");
    });

    test("name changes are recorded", () => {
      ball.name = "dave";
      expectRecordedProperties(ball, "name");
    });

    test("name changes that produce article changes are recorded", () => {
      ball.name = "orange";
      expectRecordedProperties(ball, "name", "article");
    });

    test("alias changes are recorded", () => {
      ball.aliases = "sphere";
      expectRecordedProperties(ball, "aliases");
    });

    test("description changes are recorded", () => {
      ball.description = "quite good";
      expectRecordedProperties(ball, "description");
    });

    test("holdable changes are recorded", () => {
      ball.holdable = false;
      expectRecordedProperties(ball, "holdable");
    });

    test("size changes are recorded", () => {
      ball.size = 12;
      expectRecordedProperties(ball, "size");
    });

    test("visible changes are recorded", () => {
      ball.visible = false;
      expectRecordedProperties(ball, "visible");
    });

    test("container changes are recorded", () => {
      room.addItem(ball);
      expectRecordedProperties(ball, "container");
    });

    test("container removals are recorded and don't cause errors", () => {
      room.addItem(ball);
      ball.container = null;
      expectRecordedProperties(ball, "container");
    });

    test("container changes are recorded immediately", () => {
      room.addItem(ball);
      expectRecordedProperties(ball, "container");
    });

    test("hidden items have a container change recorded when they're revealed", async () => {
      chest.hidesItems = ball;
      await chest.verbs.open.attempt(chest);
      await chest.verbs.examine.attempt(chest);
      expectRecordedProperties(ball, "container");
    });

    test("changes to hidden items are recorded", () => {
      chest.hidesItems = ball;
      chest.hidesItems = [];
      expectRecordedProperties(chest, "hidesItems");
    });

    test("changes to container listing are recorded", () => {
      ball.containerListing = "a round ball";
      expectRecordedProperties(ball, "containerListing");
    });

    test("changes to canHoldItems are recorded", () => {
      ball.canHoldItems = true;
      expectRecordedProperties(ball, "canHoldItems");
    });

    test("changes to capacity are recorded and cause other changes", () => {
      ball.capacity = 5;
      expectRecordedProperties(ball, "capacity", "free", "canHoldItems");
    });

    test("changes to free are recorded", () => {
      ball.free = 3;
      expectRecordedProperties(ball, "free");
    });

    test("changes to preposition are recorded", () => {
      ball.preposition = "without";
      expectRecordedProperties(ball, "preposition");
    });

    test("changes to itemsVisibleFromSelf are recorded", () => {
      ball.itemsVisibleFromSelf = false;
      expectRecordedProperties(ball, "itemsVisibleFromSelf");
    });

    test("changes to itemsVisibleFromRoom are recorded", () => {
      ball.itemsVisibleFromRoom = false;
      expectRecordedProperties(ball, "itemsVisibleFromRoom");
    });

    test("changes to doNotList are recorded", () => {
      ball.doNotList = true;
      expectRecordedProperties(ball, "doNotList");
    });

    test("changes to article are recorded", () => {
      ball.article = "an";
      expectRecordedProperties(ball, "article");
    });

    test("changes to takeSuccessText are recorded", () => {
      ball.takeSuccessText = "yoink";
      expectRecordedProperties(ball, "takeSuccessText");
    });

    test("new items aren't recorded", () => {
      const bat = new Item("bat", "the wooden kind");
      expectRecordedProperties(bat);
    });
  });

  test("changes aren't recorded when recording is off", () => {
    ball.name = "round thing";
    ball.description = "very shiny";
    ball.holdable = false;
    ball.visible = false;
    ball.size = 12;
    room.addItem(ball);
    ball.hidesItems = new Item("air");
    expectRecordedProperties(ball);
  });

  test("creating an item with the constructor doesn't record changes", () => {
    const car = new Item("car", "fast", false, 50, [new Verb("drive")], ["motor"], [new Item("seat")]);
    expect(car._alteredProperties).toEqual(new Set());
    expectRecordedProperties(car);
  });

  test("creating an item with newItem doesn't record changes", () => {
    const car = newItem({
      name: "car",
      description: "fast",
      holdable: false,
      size: 50,
      verbs: [new Verb("drive")],
      aliases: ["motor"],
      hidesItems: [new Item("seat")],
      visible: false,
      container: new Item("garage"),
      containerListing: "there's a car",
      canHoldItems: true,
      capacity: 20
    });
    expectRecordedProperties(car);
  });

  test("creating an item with the builder doesn't record changes", () => {
    const car = new Item.Builder()
      .withName("car")
      .withDescription("fast")
      .isHoldable()
      .withSize(50)
      .withVerbs(new Verb("drive"))
      .withAliases("motor")
      .hidesItems(new Item("seat"))
      .withTakeSuccessText("yoink")
      .build();
    expectRecordedProperties(car);
  });

  test("cloning an item doesn't record changes", () => {
    const newBall = ball.clone();
    expectRecordedProperties(newBall);
    expectRecordedProperties(ball);
  });

  test("cloning an item maintains a function description", () => {
    let x = "wooden";
    const bat = new Item("bat", () => `The bat is ${x}`);
    const batClone = bat.clone();
    x = "flying";
    expect(batClone.description).toBe("The bat is flying");
  });
});
