import { Item } from "../game/items/item";
import { Room } from "../game/items/room";
import { initGame } from "../gonorth";
import { recordChanges } from "../redux/gameActions";
import { getStore, unregisterStore } from "../redux/storeRegistry";
import { moveItem } from "./itemFunctions";
import { checkpoint, deleteSave, loadSave } from "./lifecycle";
import { selectInventory } from "./selectors";

jest.mock("./consoleIO");
const consoleIO = require("./consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let mockStorage, ball, playground;

const initialiser = () => {
  ball = new Item("ball");
  playground = new Room("playground");
  playground.addItem(ball);
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
    }
  };
  initGame("test", "", { debugMode: false }, initialiser);
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
  initGame("test", "", { debugMode: false }, initialiser);
  getStore().dispatch(recordChanges());

  // Load the previous save.
  loadSave();

  // State should be as it was saved.
  expect(ball.container.name).toBe("player");
  expect(selectInventory().items.ball).toBeDefined();
  expect(playground.items.ball).toBeUndefined();

  // Reset the state, as if we're starting a new session.
  deleteSave();

  // State should be as per starting state.
  expect(ball.container.name).toBe("playground");
  expect(selectInventory().items.ball).toBeUndefined();
  expect(playground.items.ball).toBeDefined();
});
