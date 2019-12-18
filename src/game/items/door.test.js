import { newGame, changeInteraction } from "../../redux/gameActions";
import Door from "./door";
import { getStore } from "../../redux/storeRegistry";
import Room from "./room";
import { Interaction } from "../interactions/interaction";
import { initGame } from "../../gonorth";

const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;

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
  expect(
    selectCurrentPage().includes("unlocks with a soft *click*")
  ).toBeTruthy();
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
