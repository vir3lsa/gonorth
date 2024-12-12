import gn, { Item, Room } from "../gonorth";
import { goToRoom } from "./lifecycle";
import { selectPlayer } from "./selectors";
import { moveItem } from "./itemFunctions";
import { containerHasItem, inRoom, inSameRoomAs, normaliseTest, playerHasItem } from "./sharedFunctions";

jest.mock("./consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

// Prevent console logging
gn.init({ title: "test", goToTitleScreen: false });

const parlour = new Room.Builder("parlour").build();
const anotherParlour = new Room.Builder("another parlour").build();
const scullery = new Room.Builder("scullery").build();

const ball = new Item.Builder("ball").withDescription("a red ball").build();
const spoon = new Item.Builder("spoon").withDescription("a wooden spoon").build();
const watch = new Item.Builder("watch").withDescription("a pocket watch").build();
const anotherWatch = new Item.Builder("another watch").withDescription("looks familiar").build();

describe("inSameRoomAs function", () => {
  beforeEach(() => {
    parlour.addItem(ball);
    scullery.addItem(spoon);
    selectPlayer().addItem(watch);
    goToRoom(parlour);
  });

  it("gives true when player is in room with item", () => expect(inSameRoomAs(ball)).toBe(true));
  it("gives false when player is not in room with item", () => expect(inSameRoomAs(spoon)).toBe(false));
  it("gives true when item is in player's inventory", () => expect(inSameRoomAs(watch)).toBe(true));
  it("returns true when the player is in the named room", () => expect(inRoom("parlour")).toBe(true));
  it("returns false when the player is not in the named room", () => expect(inRoom("scullery")).toBe(false));
  it("returns true when the player is in the named room case notwithstanding", () =>
    expect(inRoom("PARLOUR")).toBe(true));
});

describe("normaliseTest function", () => {
  const context = { verb: ball.getVerb("inspect"), item: ball };
  it("defaults to true", () => expect(normaliseTest(undefined)(context)).toBe(true));
  it("turns a boolean into a function", () => expect(normaliseTest(false)(context)).toBe(false));
  it("leaves a function alone", () => expect(normaliseTest(() => false)(context)).toBe(false));
});

describe("playerHasItem function", () => {
  beforeEach(() => {
    selectPlayer().removeItem(watch);
    selectPlayer().removeItem(anotherWatch);
  });

  it("returns true if the player has the item", () => {
    moveItem(watch, selectPlayer());
    expect(playerHasItem(watch)).toBe(true);
  });

  it("returns true if the player has the item by name", () => {
    moveItem(watch, selectPlayer());
    expect(playerHasItem("watch")).toBe(true);
  });

  it("returns true if the player has the item by name and index", () => {
    moveItem(anotherWatch, selectPlayer());
    expect(playerHasItem("watch", 1)).toBe(true);
  });

  it("returns false if the player doesn't have the item", () => expect(playerHasItem(spoon)).toBe(false));
  it("returns false if the player doesn't have the item by name", () => expect(playerHasItem("spoon")).toBe(false));
  it("returns false if the player doesn't have the item by name and index", () =>
    expect(playerHasItem("watch", 1)).toBe(false));
  it("returns false if the item doesn't exist", () => expect(playerHasItem("baloney")).toBe(false));
});

describe("containerHasItem function", () => {
  beforeEach(() => {
    parlour.removeItem(watch);
    anotherParlour.removeItem(anotherWatch);
  });

  it("returns true if the parlour has the item", () => {
    moveItem(watch, parlour);
    expect(containerHasItem(parlour, watch)).toBe(true);
  });

  it("returns true if the parlour has the item by names", () => {
    moveItem(watch, parlour);
    expect(containerHasItem("parlour", "watch")).toBe(true);
  });

  it("returns true if the parlour has the item by names and indices", () => {
    moveItem(anotherWatch, anotherParlour);
    expect(containerHasItem("parlour", "watch", 1, 1)).toBe(true);
  });

  it("returns false if the parlour doesn't have the item", () => expect(containerHasItem(parlour, spoon)).toBe(false));
  it("returns false if the parlour doesn't have the item by names", () =>
    expect(containerHasItem("parlour", "spoon")).toBe(false));
  it("returns false if the parlour doesn't have the item by names and indices", () =>
    expect(containerHasItem("parlour", "watch", 1, 1)).toBe(false));
  it("returns false if the container doesn't exist", () => expect(containerHasItem("stables", watch)).toBe(false));
});
