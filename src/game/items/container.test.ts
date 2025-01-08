import { Item } from "./item";
import { Verb } from "../verbs/verb";
import gn, { ActionClass, selectInventory } from "../../gonorth";
import { recordChanges } from "../../redux/gameActions";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Container } from "./container";
import { selectCurrentPage } from "../../utils/testSelectors";
import { Key } from "./door";
import { clearPage } from "../../utils/sharedFunctions";
import { selectItem } from "../../utils/selectors";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();

  // Pretend we're in the browser
  gn.init({ title: "Jolly Capers", goToTitleScreen: false });
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
      .onOpen("it opens")
      .onClose("it closes")
      .isLockable()
      .withKey("key obj")
      .onWrongKey("wrong key")
      .onNeedsKey("needs key")
      .onAlreadyUnlocked("already unlocked")
      .onUnlock("unlocked")
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
    expect(bucket.onOpen).toStrictEqual(["it opens"]);
    expect(bucket.onClose).toStrictEqual(["it closes"]);
    expect(bucket.lockable).toBe(true);
    expect(bucket.key).toBe("key obj");
    expect(bucket.onWrongKey).toStrictEqual(["wrong key"]);
    expect(bucket.onNeedsKey).toStrictEqual(["needs key"]);
    expect(bucket.onAlreadyUnlocked).toStrictEqual(["already unlocked"]);
    expect(bucket.onUnlock).toStrictEqual(["unlocked"]);
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
    expect(selectItem("pocket")).toBeDefined();
    expect(selectItem("trouser")).toBeUndefined();
    expect(selectItem("cloth")).toBeUndefined();
  });

  test("cloned aliases are also omitted", () => {
    const pocket = new Container.Builder("trouser pocket")
      .withAliases("cloth pouch")
      .omitAliases("trouser", "cloth")
      .build();
    expect(pocket.clone().aliases).toEqual(["pocket", "pouch", "cloth pouch"]);
    expect(selectItem("pocket")).toBeDefined();
    expect(selectItem("trouser")).toBeUndefined();
    expect(selectItem("cloth")).toBeUndefined();
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

  test("gives the basic description whether open or closed", async () => {
    const shelf = new Container.Builder("shelf").withDescription("A plank with stuff").isOpen().build();
    await shelf.try("examine");
    expect(selectCurrentPage()).toInclude("A plank with stuff");
    await shelf.try("close");
    clearPage();
    await shelf.try("examine");
    expect(selectCurrentPage()).toBe("A plank with stuff");
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
    const lockbox = new Container.Builder().withName("lockbox").isOpen().isLocked().onLocked("chained open").build();
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
    expect(box.onLocked).toBe("The box is locked.");
    expect(box.onAlreadyOpen).toBe("The box is already open.");
    expect(box.onAlreadyClosed).toBe("The box is already closed.");
    expect(box.onAlreadyUnlocked).toBe("The box is already unlocked.");

    const boxes = new Container.Builder("boxes").isPlural().build();
    expect(boxes.onLocked).toBe("The boxes are locked.");
    expect(boxes.onAlreadyOpen).toBe("The boxes are already open.");
    expect(boxes.onAlreadyClosed).toBe("The boxes are already closed.");
    expect(boxes.onAlreadyUnlocked).toBe("The boxes are already unlocked.");
  });

  test("Non-hidden items may be added via the builder", () => {
    const cake = new Container.Builder("cake")
      .hasItem(new Item.Builder("bride"))
      .hasItem(new Item.Builder("groom"))
      .hasItems(new Item.Builder("icing"), new Item.Builder("ribbon"))
      .build();
    expect(cake.items.bride).toBeDefined();
    expect(cake.items.groom).toBeDefined();
    expect(cake.items.icing).toBeDefined();
    expect(cake.items.ribbon).toBeDefined();
  });

  test("containers may have relinquish tests and receive context", async () => {
    let x = 0;
    let y = 0;
    const ball = new Item.Builder("ball").isHoldable().build();
    new Container.Builder("box")
      .withRelinquishTest(() => x < 1, "x too big")
      .withRelinquishTest(() => y < 1, "y too big")
      .withRelinquishTest(({ item, other }) => item.name === "ball" && other!.name === "box", "wrong names")
      .hasItem(ball)
      .isOpen()
      .build();
    await ball.try("take");
    expect(selectInventory().items.ball[0].name).toBe("ball");
    expect(selectCurrentPage()).not.toInclude("x too big");
    expect(selectCurrentPage()).not.toInclude("y too big");
    expect(selectCurrentPage()).not.toInclude("wrong names");
  });

  test("relinquish tests may fail and receive context", async () => {
    let x = 0;
    let y = 1;
    const ball = new Item.Builder("ball").isHoldable().build();
    new Container.Builder("box")
      .withRelinquishTest(() => x < 1, "x too big")
      .withRelinquishTest(
        () => y < 1,
        ({ item, other }) => `y too big to take ${item!.name} from ${other!.name}`
      )
      .hasItem(ball)
      .isOpen()
      .build();
    await ball.try("take");
    expect(selectInventory().items.ball).not.toBeDefined();
    expect(selectCurrentPage()).not.toInclude("x too big");
    expect(selectCurrentPage()).toInclude("y too big to take ball from box");
  });

  describe("actions", () => {
    test("onOpen", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .onOpen(new ActionClass(({ item, verb }) => `Jack pops out of the ${verb!.name} ${item!.name}.`, false), "Boo!")
        .build();
      await box.try("open");
      expect(selectCurrentPage()).toInclude("Jack pops out of the open box.");
      expect(selectCurrentPage()).toInclude("Boo!");
    });

    test("onClose", async () => {
      const box = new Container.Builder("box")
        .isOpen()
        .onClose(({ item, verb }) => `The ${item!.name} ${verb!.name}s with a click.`)
        .build();
      await box.try("close");
      expect(selectCurrentPage()).toInclude("The box closes with a click.");
    });

    test("onLocked", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .isLocked()
        .onLocked(new ActionClass(({ item, verb }) => `The ${item!.name} just won't ${verb!.name}.`, false), "Rats!")
        .build();
      await box.try("open");
      expect(selectCurrentPage()).toInclude("The box just won't open.");
      expect(selectCurrentPage()).toInclude("Rats!");
    });

    test("onNeedsKey", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .isLocked()
        .withKey("key")
        .onNeedsKey(({ item, verb }) => `The ${item!.name} requires a key to be ${verb!.name}ed.`)
        .build();
      await box.try("unlock");
      expect(selectCurrentPage()).toInclude("The box requires a key to be unlocked.");
    });

    test("onWrongKey", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .isLocked()
        .withKey("key")
        .onWrongKey(new ActionClass(({ item, verb }) => `The ${item!.name} won't ${verb!.name} with that key.`, false), "Gah!")
        .build();
      await box.try("unlock", new Key.Builder("wrong key").build());
      expect(selectCurrentPage()).toInclude("The box won't unlock with that key.");
      expect(selectCurrentPage()).toInclude("Gah!");
    });

    test("onAlreadyOpen", async () => {
      const box = new Container.Builder("box")
        .isOpen()
        .onAlreadyOpen(({ item, verb }) => `The ${item!.name} is already ${verb!.name}, silly.`)
        .build();
      await box.try("open");
      expect(selectCurrentPage()).toInclude("The box is already open, silly.");
    });

    test("onAlreadyClosed", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .onAlreadyClosed(new ActionClass(({ item, verb }) => `The ${item!.name} is already ${verb!.name}d, silly.`, false), "Give up.")
        .build();
      await box.try("close");
      expect(selectCurrentPage()).toInclude("The box is already closed, silly.");
      expect(selectCurrentPage()).toInclude("Give up.");
    });

    test("onUnlock", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .isLocked()
        .onUnlock(({ item, verb }) => `The ${item!.name} ${verb!.name}s, as expected.`)
        .build();
      await box.try("unlock");
      expect(selectCurrentPage()).toInclude("The box unlocks, as expected.");
    });

    test("onAlreadyUnlocked", async () => {
      const box = new Container.Builder("box")
        .isOpen(false)
        .isLockable(true)
        .isLocked(false)
        .onAlreadyUnlocked(new ActionClass(({ item, verb }) => `The ${item!.name} is already ${verb!.name}ed, Barny.`, false), "Open it.")
        .build();
      await box.try("unlock");
      expect(selectCurrentPage()).toInclude("The box is already unlocked, Barny.");
      expect(selectCurrentPage()).toInclude("Open it.");
    });
  });
});
