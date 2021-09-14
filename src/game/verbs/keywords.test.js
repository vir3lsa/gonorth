import { unregisterStore } from "../../redux/storeRegistry";
import { Item } from "../items/item";
import { getKeyword, createKeywords } from "./keywords";
import { selectCurrentPage } from "../../utils/testSelectors";
import { initStore } from "../../redux/store";
import { selectInventory } from "../../utils/selectors";
import { initGame } from "../../gonorth";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game;

beforeEach(() => {
  unregisterStore();
  initStore();
  createKeywords();
  game = initGame("Jolly Capers", false);
});

test("inventory lists a single item", async () => {
  selectInventory().addItem(new Item("spoon"));
  await getKeyword("inventory").attempt();
  expect(selectCurrentPage()).toInclude("You're carrying a spoon.");
});

test("inventory lists a single item using the correct indefinite article", async () => {
  selectInventory().addItem(new Item("apron"));
  await getKeyword("inventory").attempt();
  expect(selectCurrentPage()).toInclude("You're carrying an apron.");
});

test("inventory lists two items", async () => {
  selectInventory().addItem(new Item("spoon"));
  selectInventory().addItem(new Item("apron"));
  await getKeyword("inventory").attempt();
  const expectedText = "You're carrying a spoon and an apron.";
  expect(selectCurrentPage()).toInclude(expectedText);
});

test("inventory lists three items", async () => {
  selectInventory().addItem(new Item("spoon"));
  selectInventory().addItem(new Item("apron"));
  selectInventory().addItem(new Item("screwdriver"));
  await getKeyword("inventory").attempt();
  const expectedText = "You're carrying a spoon, an apron and a screwdriver.";
  expect(selectCurrentPage()).toInclude(expectedText);
});

test("inventory lists four items", async () => {
  selectInventory().addItem(new Item("spoon"));
  selectInventory().addItem(new Item("apron"));
  selectInventory().addItem(new Item("screwdriver"));
  selectInventory().addItem(new Item("teddy bear"));
  await getKeyword("inventory").attempt();
  const expectedText =
    "You're carrying a spoon, an apron, a screwdriver and a teddy bear.";
  expect(selectCurrentPage()).toInclude(expectedText);
});
