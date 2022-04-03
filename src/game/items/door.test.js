import { newGame, changeInteraction } from "../../redux/gameActions";
import { Door, Key } from "./door";
import { getStore } from "../../redux/storeRegistry";
import { Room } from "./room";
import { Interaction } from "../interactions/interaction";
import { initGame } from "../../gonorth";
import { Item } from "./item";

const selectCurrentPage = () => getStore().getState().game.interaction.currentPage;

// Prevent console logging
getStore().dispatch(newGame({}, true, false));

let game, room, door;

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

beforeEach(() => {
  room = new Room("Hall", "");
  door = new Door("heavy oak door", "", false, true);
  getStore().dispatch(changeInteraction(new Interaction("")));
  game = initGame("The Giant's Castle", false);
  getStore().dispatch(newGame(game, true));
  game.room = room;
});

test("doors can be unlocked", async () => {
  await door.try("unlock");
  expect(door.locked).toBe(false);
  expect(selectCurrentPage().includes("unlocks with a soft *click*")).toBeTruthy();
});

test("doors can only be unlocked once", async () => {
  await door.try("unlock");
  await door.try("unlock");
  expect(selectCurrentPage().includes("already unlocked")).toBeTruthy();
});

test("doors can't be opened when they're locked", async () => {
  await door.try("open");
  expect(door.open).toBe(false);
  expect(selectCurrentPage().includes("is locked")).toBeTruthy();
});

test("doors can be opened", async () => {
  await door.try("unlock");
  await door.try("open");
  expect(door.open).toBe(true);
  expect(selectCurrentPage().includes("opens relatively easily")).toBeTruthy();
});

test("doors can only be opened once", async () => {
  await door.try("unlock");
  await door.try("open");
  await door.try("open");
  expect(selectCurrentPage().includes("already open")).toBeTruthy();
});

test("doors can't be unlocked without a key if they require one", async () => {
  door.key = new Key("key");
  await door.try("unlock");
  expect(selectCurrentPage().includes("appears to need a key"));
});

test("doors can be unlocked with the correct key", async () => {
  door.key = new Key("key");
  await door.try("unlock", door.key);
  expect(selectCurrentPage()).toInclude("key turns easily");
});

test("doors can be unlocked with a key of the correct name", async () => {
  door.key = new Key("key");
  await door.try("unlock", new Item("key"));
  expect(selectCurrentPage()).toInclude("key turns easily");
});

test("doors can't be unlocked with the wrong key", async () => {
  door.key = new Key("key");
  await door.try("unlock", new Item("key2"));
  expect(selectCurrentPage()).toInclude("doesn't fit");
});

test("keys must be Key instances", () => {
  expect(() => (door.key = new Item("key"))).toThrow("Keys must be Key instances.");
});
