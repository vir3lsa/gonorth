import Item from "./item";
import { initStore } from "../../redux/store";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { SequentialText } from "../interactions/text";
import { newGame } from "../../redux/gameActions";
import { selectInventory } from "../../utils/selectors";
import Room from "./room";
import { initGame, setInventoryCapacity } from "../../gonorth";
import { selectOptions } from "../../utils/testSelectors";

expect.extend({
  toInclude(received, text) {
    const pass = received.includes(text);
    return {
      message: () =>
        `expected '${received}' ${pass ? "not " : ""}to contain '${text}'`,
      pass
    };
  }
});

const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;

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
  const clock = new Item("clock", item => {
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
  setTimeout(() => selectOptions()[0].action());
  expect(selectOptions()).toBeNull();
});

test("items can be picked up", async () => {
  const watch = new Item("watch", "posh-looking", true, 1);
  room.addItem(watch);
  await watch.try("take");
  expect(selectInventory().items.watch.name).toBe("watch");
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
    expect(table.items[ball.name]).toBe(ball);
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
});
