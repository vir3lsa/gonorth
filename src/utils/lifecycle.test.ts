import { Item } from "../game/items/item";
import { Room } from "../game/items/room";
import { initGame, setStartingRoom } from "../gonorth";
import { newGame, recordChanges } from "../redux/gameActions";
import { getStore, unregisterStore } from "../redux/storeRegistry";
import { moveItem } from "./itemFunctions";
import { checkpoint, deleteSave, loadSave, goToRoom, resetStateToPrePlay, play } from "./lifecycle";
import { selectAutoActions, selectGame, selectInventory, selectRoom } from "./selectors";
import { selectCurrentPage } from "./testSelectors";

jest.mock("./consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let mockStorage: Record<string, string>, ball: ItemT, playground: RoomT, house: RoomT;

const initialiser = () => {
  ball = new Item("ball");
  playground = new Room("playground");
  playground.addItem(ball);

  house = new Room("house");
  playground.setWest(house);
};

beforeEach(() => {
  mockStorage = {};
  global.localStorage = {
    getItem: (key) => mockStorage[key],
    setItem: (key, value) => (mockStorage[key] = value),
    removeItem: (key) => {
      if (mockStorage.hasOwnProperty(key)) {
        delete mockStorage[key];
      }
    },
    length: 0,
    clear: () => {},
    key: (index: number) => null
  };
  initGame("Space Auctioneer", "", { debugMode: false }, "1.0.0", initialiser);
  setStartingRoom(playground);
});

test("delete save resets items to initial state", () => {
  // Start recording.
  getStore().dispatch(recordChanges());

  // Move something.
  moveItem(ball, selectInventory());

  // Save a snapshot.
  checkpoint();

  // Destroy and recreate the store as if we're starting a new session.
  unregisterStore();
  initGame("test", "", { debugMode: false }, "1.0.0", initialiser);
  getStore().dispatch(recordChanges());

  // Load the previous save.
  loadSave();

  // State should be as it was saved.
  expect(ball.container?.name).toBe("player");
  expect(selectInventory().items.ball).toBeDefined();
  expect(playground.items.ball).toBeUndefined();

  // Reset the state, as if we're starting a new session.
  deleteSave();

  // State should be as per starting state.
  expect(ball.container?.name).toBe("playground");
  expect(selectInventory().items.ball).toBeUndefined();
  expect(playground.items.ball).toBeDefined();
});

test("goToRoom fails if the object is not a room", () => {
  expect(() => goToRoom(ball)).toThrowWithMessage(
    Error,
    "Tried to change room but the object provided is not a Room. Its name field (if any) is: ball"
  );
});

test("goToRoom succeeds when a room object is passed", () => {
  goToRoom(house);
  expect(selectRoom()).toBe(house);
});

test("goToRoom succeeds when a room name is passed", () => {
  goToRoom("house");
  expect(selectRoom()).toBe(house);
});

// Had a defect where auto actions were lost - check it's fixed.
test("resetStateToPrePlay restores auto actions", () => {
  resetStateToPrePlay();
  expect(selectAutoActions().length).toBe(2);
});

test("play shows the game title", async () => {
  await play();
  expect(selectCurrentPage()).toInclude("# Space Auctioneer");
});

test("play hides the game title", async () => {
  const game = selectGame();
  game.config.hideTitle = true;
  getStore().dispatch(newGame(game, game.config.debugMode));
  await play();
  expect(selectCurrentPage()).not.toInclude("# Space Auctioneer");
});