import { Item, newItem } from "./item";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { SequentialText } from "../interactions/text";
import { newGame, recordChanges } from "../../redux/gameActions";
import { selectInventory, selectInventoryItems, selectItemNames } from "../../utils/selectors";
import { Room } from "./room";
import { initGame, setInventoryCapacity, goToRoom } from "../../gonorth";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { Container } from "./container";
import { Verb } from "../verbs/verb";
import { clickNextAndWait, deferAction } from "../../utils/testFunctions";
import { clearPage } from "../../utils/sharedFunctions";

let game, room: RoomT;

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", "", { debugMode: false });
  room = new Room("red");
  getStore().dispatch(newGame(game, false));
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

      return "It's late";
    });

    expect(clock.description).toBe("It's 12 o'clock");
    expect(clock.description).toBe("It's 1 o'clock");
  });

  it("Doesn't render a Next button for cyclic descriptions", () => {
    const table = new Item("table", ["It's made of wood.", "It has four legs."]);
    table.try("x");
    expect(selectOptions()).toBeUndefined();
  });

  it("renders each page of sequential text then stops", async () => {
    const chair = new Item("chair", new SequentialText("a", "b"));
    chair.try("x");
    const clickNextPromise = new Promise((resolve) =>
      setTimeout(async () => {
        await clickNextAndWait();
        resolve(null);
      })
    );
    expect(selectOptions()).toBeUndefined();
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

  test("items can produce another item", async () => {
    const spoons = new Item.Builder("spoons").isHoldable().isManyAndProduces(new Item.Builder("spoon")).build();
    await spoons.try("take");
    expect(selectInventoryItems()[0].name).toBe("spoon");
  });

  test("message is correct when trying to take produced item twice", async () => {
    const spoons = new Item.Builder("spoons").isHoldable().isManyAndProduces(new Item.Builder("spoon")).build();
    await spoons.try("take");
    await spoons.try("take");
    expect(selectCurrentPage()).toInclude("already got a spoon");
  });

  test("article is correct when trying to take produced item twice", async () => {
    const onions = new Item.Builder("onions").isHoldable().isManyAndProduces(new Item.Builder("onion")).build();
    await onions.try("take");
    await onions.try("take");
    expect(selectCurrentPage()).toInclude("already got an onion");
  });

  test("verbs are deferred to the child after first taking the child", async () => {
    const onions = new Item.Builder("onions")
      .isHoldable()
      .isManyAndProduces(new Item.Builder("onion").isHoldable())
      .withTakeSuccessText("you take an onion")
      .build();
    await onions.try("put", room);
    expect(selectCurrentPage()).toInclude("you take an onion");
    expect(selectCurrentPage()).toInclude("put the onion on the floor");
  });

  test("remote verbs on the child are deferred to without first taking the child", async () => {
    const onions = new Item.Builder("onions")
      .isHoldable()
      .isManyAndProduces(
        new Item.Builder("onion").withVerb(new Verb.Builder("smell").isRemote().withOnSuccess("smells strongly"))
      )
      .withTakeSuccessText("you take an onion")
      .build();
    await onions.try("smell");
    expect(selectCurrentPage()).not.toInclude("you take an onion");
    expect(selectCurrentPage()).toInclude("smells strongly");
  });

  test("items can be added as Builders", async () => {
    const laptop = new Item.Builder("laptop");
    room.addItem(laptop);
    expect(room.items.laptop[0].name).toBe("laptop");
  });

  test("hidden items can be added as Builders", async () => {
    const laptop = new Item.Builder("laptop").hidesItems(new Item.Builder("sticker")).build();
    await laptop.try("examine");
    expect(laptop.items.sticker[0].name).toBe("sticker");
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

  test("verbs can be acquired using getVerb", () => {
    const bat = new Item.Builder("bat").build();
    const examine = bat.getVerb("examine");
    expect(examine.name).toBe("examine");
    expect(examine.aliases).toContain("x");
  });

  test("an error message is given if the verb cannot be found", () => {
    const bat = new Item.Builder("bat").build();
    expect(() => bat.getVerb("swing")).toThrow('No verb with the name "swing" exists on the item "bat"');
  });

  test("correct plurality used for singular item", async () => {
    const gift = new Item.Builder("gift").isHoldable().withTakeSuccessText("For me?").build();
    await gift.try("take");
    expect(selectCurrentPage()).toInclude("For me?");
    return deferAction(async () => {
      await gift.try("give", gift);
      expect(selectCurrentPage()).toInclude("can't give the gift to itself");
      await gift.try("put", gift);
      expect(selectCurrentPage()).toInclude("can't put the gift in itself");
    });
  });

  test("correct plurality used for plural item", async () => {
    const gifts = new Item.Builder("gifts").isHoldable().isPlural().withTakeSuccessText("For me?").build();
    await gifts.try("take");
    expect(selectCurrentPage()).toInclude("For me?");
    return deferAction(async () => {
      await gifts.try("give", gifts);
      expect(selectCurrentPage()).toInclude("can't give the gifts to themselves");
      await gifts.try("put", gifts);
      expect(selectCurrentPage()).toInclude("can't put the gifts in themselves");
    });
  });

  test("correct plurality used when taking too large singular item", async () => {
    setInventoryCapacity(10);
    const boulder = new Item.Builder("boulder").isHoldable().withSize(100).build();
    await boulder.try("take");
    expect(selectCurrentPage()).toInclude("The boulder is far too large");
    boulder.size = 11;
    clearPage();
    await boulder.try("take");
    expect(selectCurrentPage()).toInclude("The boulder is too big");
  });

  test("correct plurality used when taking too large plural item", async () => {
    setInventoryCapacity(10);
    const boulders = new Item.Builder("boulders").isPlural().isHoldable().withSize(100).build();
    await boulders.try("take");
    expect(selectCurrentPage()).toInclude("The boulders are far too large");
    boulders.size = 11;
    clearPage();
    await boulders.try("take");
    expect(selectCurrentPage()).toInclude("The boulders are too big");
  });

  test("container listings may be functions", () => {
    const mouse = new Item.Builder("mouse").withContainerListing((item) => `a little white ${item.name}`).build();
    expect(mouse.containerListing).toBe("a little white mouse");
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
      .withProperty("appearance", "pipelike")
      .withProperty("length", 12)
      .itemsVisibleFromSelf(false)
      .itemsVisibleFromRoom(false)
      .build();
    expect(pipe.name).toBe("pipe");
    expect(pipe.description).toBe("This is not a pipe");
    expect(pipe.holdable).toBe(true);
    expect(pipe.size).toBe(1);
    expect(pipe.aliases).toInclude("pope");
    expect(pipe.article).toBe("thy");
    expect(pipe.takeSuccessText).toBe("yoink");
    expect(pipe.get("appearance")).toBe("pipelike");
    expect(pipe.get("length")).toBe(12);
    expect(pipe.itemsVisibleFromSelf).toBe(false);
    expect(pipe.itemsVisibleFromRoom).toBe(false);
  });

  test("items built with a builder have the correct verbs", () => {
    const pipe = new Item.Builder().withName("pipe").isHoldable().withVerbs(new Verb("smoke")).build();
    expect(pipe.name).toBe("pipe");
    expect(pipe.holdable).toBe(true);
    expect(pipe.getVerb("examine")).not.toBeUndefined();
    expect(pipe.getVerb("take")).not.toBeUndefined();
    expect(pipe.getVerb("smoke")).not.toBeUndefined();
  });

  test("verbs may be added as builders", () => {
    const spinner = new Item.Builder("spinner").withVerb(new Verb.Builder("spin")).build();
    expect(spinner.getVerb("spin")).toBeDefined();
  });

  test("verbs may be customised", async () => {
    const hat = new Item.Builder("hat")
      .isHoldable()
      .customiseVerb("examine", (examine) => examine.onSuccess.addAction("beebop"))
      .customiseVerb("take", (take) => take.onSuccess.addAction("doowop"))
      .build();
    await hat.try("examine");
    expect(selectCurrentPage()).toInclude("beebop");
    await hat.try("take");
    expect(selectCurrentPage()).toInclude("doowop");
  });

  test("cloned items maintiain verb customisations", async () => {
    const hat = new Item.Builder("hat")
      .isHoldable()
      .customiseVerb("examine", (examine) => examine.onSuccess.addAction("beebop"))
      .build();
    const hat2 = hat.clone();
    await hat2.try("examine");
    expect(selectCurrentPage()).toInclude("beebop");
  });

  test("Single verbs may be added", async () => {
    const blah = new Item.Builder("blah").withVerb(new Verb.Builder("bleh").withOnSuccess("bleeeh").build()).build();
    await blah.try("bleh");
    expect(selectCurrentPage()).toInclude("bleeeh");
  });

  test("Aliases may be omitted", () => {
    const numbers = new Item.Builder("one two three").withAliases("four five six").omitAliases("one", "five").build();
    expect(numbers.aliases).toEqual(["two", "three", "four", "six", "four five six"]);
  });

  test("Cloned items maintain omitted aliases", () => {
    const numbers = new Item.Builder("one two three").withAliases("four five six").omitAliases("one", "five").build();
    expect(numbers.clone().aliases).toEqual(numbers.aliases);
  });

  test("Items can be given verbs in dribs and drabs", () => {
    const book = new Item.Builder("book")
      .withVerb(new Verb.Builder("read"))
      .withVerb(new Verb.Builder("open"))
      .withVerbs(new Verb.Builder("tear"), new Verb.Builder("burn"))
      .build();
    expect(book.getVerb("read").name).toBe("read");
    expect(book.getVerb("open").name).toBe("open");
    expect(book.getVerb("tear").name).toBe("tear");
    expect(book.getVerb("burn").name).toBe("burn");
  });

  test("Non-hidden items may be added via the builder", () => {
    const cake = new Item.Builder("cake")
      .hasItem(new Item.Builder("bride"))
      .hasItem(new Item.Builder("groom"))
      .hasItems(new Item.Builder("icing"), new Item.Builder("ribbon"))
      .build();
    expect(cake.items.bride).toBeDefined();
    expect(cake.items.groom).toBeDefined();
    expect(cake.items.icing).toBeDefined();
    expect(cake.items.ribbon).toBeDefined();
  });
});

describe("putting items", () => {
  let ball: ItemT, table: ItemT, flowers: ItemT;

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

  test("items can be dropped on the floor", async () => {
    await ball.try("drop");
    expect(selectCurrentPage()).toContain("You put the ball on the floor");
  });

  test("items can be put using drop", async () => {
    await ball.try("drop", table);
    expect(selectCurrentPage()).toContain("You put the ball on the table");
    expect(table.itemArray).toInclude(ball);
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
  let ball: ItemT, chest: ContainerT;

  beforeEach(() => {
    ball = new Item("ball", "red", true, 1);
    chest = new Container("chest", [], "a large chest", "the lid is open");
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
  let ball: ItemT, chest: ContainerT, box: ContainerT;

  const expectRecordedProperties = (item: ItemT, ...properties: string[]) => {
    expect(item.alteredProperties).toEqual(new Set([...properties]));
  };

  beforeEach(() => {
    ball = new Item("ball", "red", true, 1);
    chest = new Container("chest", [], "a large chest", "the lid is open");
    box = new Container("box", [], "a cardboard box", "tatty and brown");
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
      ball.container = undefined;
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
      expectRecordedProperties(ball, "capacity", "canHoldItems");
    });

    test("changes to free are NOT recorded", () => {
      ball.free = 3;
      expectRecordedProperties(ball);
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

    test("custom properties are recorded", () => {
      ball.set("diameter", 10);
      expectRecordedProperties(ball, "properties");
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
    expect(car.alteredProperties).toEqual(new Set());
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

  test("items may be combined, but it fails by default", async () => {
    const clock = new Item.Builder("clock").build();
    const rivet = new Item.Builder("rivet").build();
    await clock.try("combine", rivet);
    expect(selectCurrentPage()).toInclude("can't see a way to combine the clock and the rivet");
  });

  test("items are automatically revealed when their container changes", async () => {
    const ghost = new Item.Builder("ghost").withAliases("ghoul").isHoldable().build();
    expect(selectItemNames().has("ghost")).toBe(false);
    expect(selectItemNames().has("ghoul")).toBe(false);
    // We start recording changes when the game starts.
    getStore().dispatch(recordChanges());
    // Taking the item changes its container.
    await ghost.try("take");
    expect(selectItemNames().has("ghost")).toBe(true);
    expect(selectItemNames().has("ghoul")).toBe(true);
  });

  test("items aren't automatically revealed when their container changes before the game starts", async () => {
    const ghost = new Item.Builder("ghost").withAliases("ghoul").isHoldable().build();
    // Taking the item changes its container, but the game hasn't started.
    await ghost.try("take");
    expect(selectItemNames().has("ghost")).toBe(false);
    expect(selectItemNames().has("ghoul")).toBe(false);
  });

  test("custom properties can be set and retrieved", () => {
    ball.set("material", "rubber");
    ball.set("size", "small");
    expect(ball.get("material")).toBe("rubber");
    expect(ball.get("size")).toBe("small");
  });

  test("setting a function as a property causes an error", () => {
    // @ts-ignore Deliberately testing wrong argument e.g. for when library is used as JavaScript.
    expect(() => ball.set("sound", () => "woosh")).toThrow();
  });

  test("hidden items may be added singly or as varargs", () => {
    const house = new Item.Builder("house")
      .hidesItem(new Item.Builder("chaise-longue"))
      .hidesItem(new Item.Builder("tin opener"))
      .hidesItems(new Item.Builder("man"), new Item.Builder("sink"))
      .build();
    expect(house.hidesItems[0].name).toBe("chaise-longue");
    expect(house.hidesItems[1].name).toBe("tin opener");
    expect(house.hidesItems[2].name).toBe("man");
    expect(house.hidesItems[3].name).toBe("sink");
  });
});
