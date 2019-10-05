import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import Verb from "./verb";
import { newGame } from "../redux/gameActions";

jest.mock("./subscriber");

initStore();

let y;

const verb = new Verb(
  "twirl",
  x => (y = x + 1),
  "You twirl beautifully",
  "You fall over",
  x => x > 2
);

const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;

// Prevent console logging
getStore().dispatch(newGame(null, true, false));

beforeEach(() => (y = 0));

it("prints the failure text if the test fails", () => {
  verb.attempt(1);
  expect(selectCurrentPage()).toBe("You fall over");
});

it("prints the success text if the test succeeds", () => {
  verb.attempt(3);
  expect(selectCurrentPage()).toBe("You twirl beautifully");
});

it("does not perform the action if the test fails", () => {
  verb.attempt(1);
  expect(y).toBe(0);
});

it("performs the action if the test passes", () => {
  verb.attempt(3);
  expect(y).toBe(4);
});
