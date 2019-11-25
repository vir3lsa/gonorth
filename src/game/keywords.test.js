import { getStore, unregisterStore } from "../redux/storeRegistry";
import { pickUpItem } from "../redux/gameActions";
import Item from "./item";
import { getKeyword, createKeywords } from "./keywords";
import { selectCurrentPage } from "../utils/testSelectors";
import { initStore } from "../redux/store";

jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  unregisterStore();
  initStore();
  createKeywords();
});

test("inventory lists a single item", async () => {
  getStore().dispatch(pickUpItem(new Item("spoon")));
  await getKeyword("inventory").attempt();
  expect(selectCurrentPage().includes("You're carrying a spoon.")).toBe(true);
});

test("inventory lists a single item using the correct indefinite article", async () => {
  getStore().dispatch(pickUpItem(new Item("apron")));
  await getKeyword("inventory").attempt();
  expect(selectCurrentPage().includes("You're carrying an apron.")).toBe(true);
});

test("inventory lists two items", async () => {
  getStore().dispatch(pickUpItem(new Item("spoon")));
  getStore().dispatch(pickUpItem(new Item("apron")));
  await getKeyword("inventory").attempt();
  const expectedText = "You're carrying a spoon and an apron.";
  expect(selectCurrentPage().includes(expectedText)).toBe(true);
});

test("inventory lists three items", async () => {
  getStore().dispatch(pickUpItem(new Item("spoon")));
  getStore().dispatch(pickUpItem(new Item("apron")));
  getStore().dispatch(pickUpItem(new Item("screwdriver")));
  await getKeyword("inventory").attempt();
  const expectedText = "You're carrying a spoon, an apron and a screwdriver.";
  expect(selectCurrentPage().includes(expectedText)).toBe(true);
});

test("inventory lists four items", async () => {
  getStore().dispatch(pickUpItem(new Item("spoon")));
  getStore().dispatch(pickUpItem(new Item("apron")));
  getStore().dispatch(pickUpItem(new Item("screwdriver")));
  getStore().dispatch(pickUpItem(new Item("teddy bear")));
  await getKeyword("inventory").attempt();
  const expectedText =
    "You're carrying a spoon, an apron, a screwdriver and a teddy bear.";
  expect(selectCurrentPage().includes(expectedText)).toBe(true);
});
