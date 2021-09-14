import { Item, newItem } from "./item";
import { initStore } from "../../redux/store";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { SequentialText } from "../interactions/text";
import { newGame } from "../../redux/gameActions";
import { selectInventory } from "../../utils/selectors";
import { Room } from "./room";
import { initGame, setInventoryCapacity } from "../../gonorth";
import { selectOptions } from "../../utils/testSelectors";
import { Container } from "./container";

const selectCurrentPage = () => getStore().getState().game.interaction.currentPage;

const clickNext = () => getStore().getState().game.interaction.options[0].action();

const clickNextAndWait = () => {
  clickNext();
  return selectInteraction().promise;
};

let game, room;

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();
  initStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", false);
  room = new Room("red");
  getStore().dispatch(newGame(game, true, false));
});

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
  setTimeout(async () => await clickNextAndWait());
  expect(selectOptions()).toBeNull();
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
  expect(selectCurrentPage()).toInclude("don't have enough room");
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

describe("putting items", () => {
  let ball, table, flowers;

  beforeEach(() => {
    ball = new Item("ball", "red", true, 1);
    table = new Item("table", "mahogany", false);
    flowers = new Item("flowers", "pretty", true);

    table.capacity = 10;
    table.preposition = "on";

    room.addItems(ball, table);
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
    expect(selectCurrentPage().includes("ball on the table")).toBeTruthy();
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

  test("accessible items can share names", () => {
    room.addItems(new Item("cat"), new Item("dog"), new Item("dog"));
    const items = room.accessibleItems;
    expect(items["cat"].length).toBe(1);
    expect(items["dog"].length).toBe(2);
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
