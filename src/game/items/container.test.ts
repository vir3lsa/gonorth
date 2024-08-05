import { Item } from "./item";
import { Verb } from "../verbs/verb";
import { initGame } from "../../gonorth";
import { recordChanges } from "../../redux/gameActions";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Container } from "./container";
import { selectCurrentPage } from "../../utils/testSelectors";
import { Key } from "./door";
import { clearPage } from "../../utils/sharedFunctions";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();

  // Pretend we're in the browser
  initGame("Jolly Capers", "", { debugMode: false });
});

describe("serialization", () => {
  let box: ContainerT;

  const expectRecordedProperties = (item: ItemT, ...properties: string[]) => {
    expect(item.alteredProperties).toEqual(new Set([...properties]));
  };

  beforeEach(() => {
    box = new Container("box", [], "a cardboard box", "tatty and brown");
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

  test("changes to wrongKeyText are recorded", () => {
    box.wrongKeyText = "it be the wrong key";
    expectRecordedProperties(box, "wrongKeyText");
  });

  test("changes to needsKeyText are recorded", () => {
    box.needsKeyText = "it be needing a key";
    expectRecordedProperties(box, "needsKeyText");
  });

  test("changes to alreadyUnlockedText are recorded", () => {
    box.alreadyUnlockedText = "it be already unlocked";
    expectRecordedProperties(box, "alreadyUnlockedText");
  });

  test("changes to unlockSuccessText are recorded", () => {
    box.unlockSuccessText = "it unlocked";
    expectRecordedProperties(box, "unlockSuccessText");
  });

  test("changes to key are recorded", () => {
    box.key = new Key.Builder("key").build();
    expectRecordedProperties(box, "key");
  });
});

describe("container", () => {
  let chest: ContainerT;
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
      .withOpenText("it opens")
      .withCloseText("it closes")
      .isLockable()
      .withKey("key obj")
      .withWrongKeyText("wrong key")
      .withNeedsKeyText("needs key")
      .withAlreadyUnlockedText("already unlocked")
      .withUnlockSuccessText("unlocked")
      .withProperty("material", "steel")
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
    expect(bucket.openText).toBe("it opens");
    expect(bucket.closeText).toBe("it closes");
    expect(bucket.lockable).toBe(true);
    expect(bucket.key).toBe("key obj");
    expect(bucket.wrongKeyText).toBe("wrong key");
    expect(bucket.needsKeyText).toBe("needs key");
    expect(bucket.alreadyUnlockedText).toBe("already unlocked");
    expect(bucket.unlockSuccessText).toBe("unlocked");
    expect(bucket.get("material")).toBe("steel");

    bucket.verbs.close.remote = true;
    await bucket.verbs.close.attempt(bucket);
    expect(bucket.description).toBe("closed");

    bucket.verbs.open.remote = true;
    await bucket.verbs.open.attempt(bucket);
    expect(bucket.description).toBe("open");
  });

  test("aliases may be omitted", () => {
    const pocket = new Container.Builder("trouser pocket")
      .withAliases("cloth pouch")
      .omitAliases("trouser", "cloth")
      .build();
    expect(pocket.aliases).toEqual(["pocket", "pouch", "cloth pouch"]);
  });

  test("cloned aliases are also omitted", () => {
    const pocket = new Container.Builder("trouser pocket")
      .withAliases("cloth pouch")
      .omitAliases("trouser", "cloth")
      .build();
    expect(pocket.clone().aliases).toEqual(["pocket", "pouch", "cloth pouch"]);
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

  test("can be unlocked without a key", async () => {
    const lockbox = new Container.Builder("lockbox").isLockable().isLocked().build();
    await lockbox.verbs.unlock.attempt(lockbox);
    expect(lockbox.locked).toBe(false);
    expect(selectCurrentPage()).toBe("The lockbox unlocks with a soft *click*.");
  });

  test("can be unlocked with a key", async () => {
    const key = new Key.Builder("key").build();
    const lockbox = new Container.Builder("lockbox").isLockable().isLocked().withKey(key).build();
    await lockbox.verbs.unlock.attempt(lockbox, key);
    expect(lockbox.locked).toBe(false);
    expect(selectCurrentPage()).toBe("The key turns easily in the lock.");
  });

  test("fails to unlock when a key is required", async () => {
    const key = new Key.Builder("key").build();
    const lockbox = new Container.Builder("lockbox").isLockable().isLocked().withKey(key).build();
    await lockbox.verbs.unlock.attempt(lockbox);
    expect(lockbox.locked).toBe(true);
    expect(selectCurrentPage()).toBe("The lockbox appears to need a key.");
  });

  test("fails to unlock with the wrong key", async () => {
    const key = new Key.Builder("key").build();
    const lockbox = new Container.Builder("lockbox").isLockable().isLocked().withKey(key).build();
    await lockbox.verbs.unlock.attempt(lockbox, new Key.Builder("rusty key").build());
    expect(lockbox.locked).toBe(true);
    expect(selectCurrentPage()).toBe("The key doesn't fit.");
  });

  test("can't be unlocked if it's already unlocked", async () => {
    const lockbox = new Container.Builder("lockbox").isLockable().isLocked(false).build();
    await lockbox.verbs.unlock.attempt(lockbox);
    expect(lockbox.locked).toBe(false);
    expect(selectCurrentPage()).toBe("The lockbox is already unlocked.");
  });

  test("can be given a key by name", async () => {
    const key = new Key.Builder("key").build();
    const lockbox = new Container.Builder("lockbox").isLockable().isLocked().withKey("key").build();
    await lockbox.verbs.unlock.attempt(lockbox, key);
    expect(lockbox.locked).toBe(false);
    expect(selectCurrentPage()).toBe("The key turns easily in the lock.");
  });

  test("dynamic open description function receives item", () => {
    const chest = new Container.Builder("safe")
      .withOpenDescription(({ item }) => `${item.name} open`)
      .isOpen()
      .build();
    expect(chest.description).toBe("safe open");
  });

  test("dynamic closed description function receives item", () => {
    const chest = new Container.Builder("safe").withClosedDescription(({ item }) => `${item.name} closed`).build();
    expect(chest.description).toBe("safe closed");
  });

  test("correct plurality used", () => {
    const box = new Container.Builder("box").build();
    expect(box.lockedText).toBe("The box is locked.");
    expect(box.alreadyOpenText).toBe("The box is already open.");
    expect(box.alreadyClosedText).toBe("The box is already closed.");
    expect(box.alreadyUnlockedText).toBe("The box is already unlocked.");

    const boxes = new Container.Builder("boxes").isPlural().build();
    expect(boxes.lockedText).toBe("The boxes are locked.");
    expect(boxes.alreadyOpenText).toBe("The boxes are already open.");
    expect(boxes.alreadyClosedText).toBe("The boxes are already closed.");
    expect(boxes.alreadyUnlockedText).toBe("The boxes are already unlocked.");
  });
});
