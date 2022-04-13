import { initGame, Item, Room } from "../gonorth";
import { newGame } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";
import { goToRoom } from "./lifecycle";
import { selectPlayer } from "./selectors";
import { inSameRoomAs } from "./sharedFunctions";

jest.mock("./consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

// Prevent console logging
getStore().dispatch(newGame(initGame("test", "", { debugMode: false }), true, false));

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
});
