import { Item } from "./item";
import { Verb } from "../verbs/verb";
import { initGame } from "../../gonorth";
import { recordChanges } from "../../redux/gameActions";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Container } from "./container";
import { selectCurrentPage } from "../../utils/testSelectors";
import { clearPage } from "../../utils/lifecycle";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game;

beforeEach(() => {
  unregisterStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", "", { debugMode: false });
});

describe("serialization", () => {
  let box;

  const expectRecordedProperties = (item, ...properties) => {
    expect(item._alteredProperties).toEqual(new Set([...properties]));
  };

  beforeEach(() => {
    box = new Container("box", null, "a cardboard box", "tatty and brown", false);
    getStore().dispatch(recordChanges());
  });

  test("initially no properties are considered altered", () => {
    expectRecordedProperties(box);
  });

  test("changes to open are recorded", () => {
    box.open = true;
    expectRecordedProperties(box, "open");
  });

  test("changes to locked are recorded", () => {
    box.locked = true;
    expectRecordedProperties(box, "locked");
  });

  test("changes to openText are recorded", () => {
    box.openText = "it opens";
    expectRecordedProperties(box, "openText");
  });

  test("changes to lockedText are recorded", () => {
    box.lockedText = "it be locked";
    expectRecordedProperties(box, "lockedText");
  });

  test("changes to closeText are recorded", () => {
    box.closeText = "it closes";
    expectRecordedProperties(box, "closeText");
  });

  test("changes to alreadyOpenText are recorded", () => {
    box.alreadyOpenText = "it be already open";
    expectRecordedProperties(box, "alreadyOpenText");
  });

  test("changes to alreadyClosedText are recorded", () => {
    box.alreadyClosedText = "it be already closed";
    expectRecordedProperties(box, "alreadyClosedText");
  });
});

describe("container", () => {
  let chest;
  let toy;

  beforeEach(() => {
    chest = new Container("chest", ["box"], "it's closed", "it's open", 10, "in", false, true, false, 10);
    toy = new Item("toy");
    toy.containerListing = "there's a toy nestled at the bottom of the chest.";
    chest.hidesItems = toy;
    clearPage();
  });

  test("can be built with a Builder", async () => {
    const bucket = new Container.Builder()
      .withName("bucket")
      .withAliases("pale")
      .withSize(5)
      .withCapacity(5)
      .isOpen()
      .isLocked(false)
      .isCloseable()
      .isHoldable()
      .withVerbs(new Verb("swing"))
      .hidesItems(new Item("crab"))
      .withContainerListing("there's a bucket in here")
      .withClosedDescription("closed")
      .withOpenDescription("open")
      .withPreposition("within")
      .build();
    expect(bucket.name).toBe("bucket");
    expect(bucket.aliases).toEqual(["pale"]);
    expect(bucket.size).toBe(5);
    expect(bucket.capacity).toBe(5);
    expect(bucket.open).toBe(true);
    expect(bucket.closeable).toBe(true);
    expect(bucket.holdable).toBe(true);
    expect(bucket.hidesItems[0].name).toBe("crab");
    expect(bucket.containerListing).toBe("there's a bucket in here");
    expect(bucket.preposition).toBe("within");
    expect(bucket.locked).toBe(false);

    bucket.verbs.close.remote = true;
    await bucket.verbs.close.attempt(bucket);
    expect(bucket.description).toBe("closed");

    bucket.verbs.open.remote = true;
    await bucket.verbs.open.attempt(bucket);
    expect(bucket.description).toBe("open");
  });

  test("can be closed", async () => {
    expect(chest.open).toBe(true);
    clearPage();
    await chest.verbs.close.attempt(chest);
    expect(chest.open).toBe(false);
    expect(chest.itemsVisibleFromSelf).toBe(false);
    expect(selectCurrentPage()).toBe("You close the chest with a soft thud.");
  });

  test("can be opened", async () => {
    await chest.verbs.close.attempt(chest);
    clearPage();
    expect(chest.open).toBe(false);
    await chest.verbs.open.attempt(chest);
    expect(chest.open).toBe(true);
    expect(chest.itemsVisibleFromSelf).toBe(true);
    expect(selectCurrentPage()).toBe("The chest opens easily.");
  });

  test("gives the closed description when closed", async () => {
    await chest.verbs.close.attempt(chest);
    expect(chest.description).toBe("it's closed");
  });

  test("gives the open description when open and lists visible items", async () => {
    await chest.verbs.open.attempt(chest);
    clearPage();
    await chest.verbs.examine.attempt(chest);
    expect(selectCurrentPage()).toBe("it's open\n\nthere's a toy nestled at the bottom of the chest.");
  });

  test("can't be opened or closed if not closeable", () => {
    const bucket = new Container.Builder().withName("bucket").isCloseable(false).build();
    expect(bucket.verbs.open).toBeUndefined();
    expect(bucket.verbs.close).toBeUndefined();
  });

  test("can't be opened if it's already open", async () => {
    await chest.verbs.open.attempt(chest);
    expect(selectCurrentPage()).toBe("The chest is already open.");
  });

  test("can't be closed if it's already closed", async () => {
    await chest.verbs.close.attempt(chest);
    clearPage();
    await chest.verbs.close.attempt(chest);
    expect(selectCurrentPage()).toBe("The chest is already closed.");
  });

  test("can't be opened if it's locked", async () => {
    const lockbox = new Container.Builder().withName("lockbox").isOpen(false).isLocked().build();
    await lockbox.verbs.open.attempt(lockbox);
    expect(selectCurrentPage()).toBe("The lockbox is locked.");
  });

  test("can't be closed if it's locked", async () => {
    const lockbox = new Container.Builder()
      .withName("lockbox")
      .isOpen()
      .isLocked()
      .withLockedText("chained open")
      .build();
    await lockbox.verbs.close.attempt(lockbox);
    expect(selectCurrentPage()).toBe("chained open");
  });
});
