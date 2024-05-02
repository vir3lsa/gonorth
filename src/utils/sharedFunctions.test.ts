import { initGame, Item, Room } from "../gonorth";
import { goToRoom } from "./lifecycle";
import { selectPlayer } from "./selectors";
import { inRoom, inSameRoomAs, normaliseTest } from "./sharedFunctions";

jest.mock("./consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

// Prevent console logging
initGame("test", "", { debugMode: false });

const parlour = new Room("parlour", "");
const scullery = new Room("scullery", "");

const ball = new Item("ball", "a red ball");
const spoon = new Item("spoon", "a wooden spoon");
const watch = new Item("watch", "a pocket watch");

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
