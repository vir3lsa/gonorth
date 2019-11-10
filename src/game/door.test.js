import { initStore } from "../redux/store";
import { newGame, changeInteraction } from "../redux/gameActions";
import Game from "./game";
import Door from "./door";
import { getStore } from "../redux/storeRegistry";
import Room from "./room";
import { Interaction } from "./interaction";

const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;

initStore();

// Prevent console logging
getStore().dispatch(newGame(new Game("test"), true, false));

let game, room, door;

beforeEach(() => {
  room = new Room("Hall", "");
  door = new Door("heavy oak door", "", false, true);
  getStore().dispatch(changeInteraction(new Interaction("")));
  game = new Game("The Giant's Castle");
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
