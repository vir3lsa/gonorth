import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import Verb from "./verb";
import { newGame } from "../redux/gameActions";

initStore();

let y;

const verb = new Verb(
  "twirl",
  x => x > 2,
  [x => (y = x + 1), "You twirl beautifully"],
  "You fall over",
  ["spin", "rotate"]
);

const selectCurrentPage = () =>
  getStore().getState().game.interaction.currentPage;

const storeHasVerb = verbName =>
  getStore()
    .getState()
    .game.verbNames.has(verbName);

// Prevent console logging
getStore().dispatch(newGame(null, true, false));

beforeEach(() => (y = 0));

it("prints the failure text if the test fails", () => {
  verb.attempt(1);
  expect(selectCurrentPage()).toBe("You fall over");
});

it("prints the success text if the test succeeds", async () => {
  const actionPromise = verb.attempt(3);
  await actionPromise;
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

it("adds verb names and aliases to the global registry", () => {
  new Verb("examine", true, [], [], ["look at", "inspect"]);
  expect(storeHasVerb("twirl")).toBeTruthy();
  expect(storeHasVerb("spin")).toBeTruthy();
  expect(storeHasVerb("rotate")).toBeTruthy();
  expect(storeHasVerb("look at")).toBeTruthy();
  expect(storeHasVerb("inspect")).toBeTruthy();
});

it("adds new aliases to the global registry", () => {
  verb.addAliases(["twist", "twizzle"]);
  expect(storeHasVerb("twist")).toBeTruthy();
  expect(storeHasVerb("twizzle")).toBeTruthy();
});
