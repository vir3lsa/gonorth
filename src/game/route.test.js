import { Route } from "./route";
import { TIMEOUT_TURNS } from "./event";
import Room from "./room";
import { initStore } from "../redux/store";
import { Npc } from "./npc";
import Game from "./game";
import { CyclicText } from "./text";
import { getStore, unregisterStore } from "../redux/storeRegistry";
import { newGame } from "../redux/gameActions";

jest.mock("../utils/consoleIO");

let nw;
let sw;
let se;
let ne;
let game;
let gran;

function createRoute(
  subject,
  condition,
  continueOnFail,
  text = "",
  ...directions
) {
  const routeBuilder = new Route.Builder()
    .withSubject(subject)
    .withCondition(condition)
    .withContinueOnFail(continueOnFail);

  directions.forEach((direction, index) => {
    routeBuilder
      .go(direction)
      .withDelay(index === 0 ? 0 : 1) // No delay to start, then delay of 1 turn
      .withDelayType(TIMEOUT_TURNS)
      .withText(text);
  });

  const route = routeBuilder.build();
  game.addSchedule(route);
  return route;
}

function getCurrentPage() {
  return getStore().getState().game.interaction.currentPage;
}

beforeEach(() => {
  unregisterStore();
  initStore();
  game = new Game();
  getStore().dispatch(newGame(game, true, false));

  nw = new Room("nw");
  sw = new Room("sw");
  se = new Room("se");
  ne = new Room("ne");

  nw.setSouth(sw);
  sw.setEast(se);
  se.setNorth(ne);
  ne.setWest(nw);

  gran = new Npc("gran");
  nw.addItem(gran);
});

test("routes can be built", () => {
  createRoute(null, true, false, null, "north");
});

test("NPCs can follow routes", async () => {
  createRoute(gran, true, false, null, "s", "e", "n", "w");
  expect(gran.container).toBe(nw);
  await game.handleTurnEnd();
  expect(gran.container).toBe(sw);
  await game.handleTurnEnd();
  expect(gran.container).toBe(se);
  await game.handleTurnEnd();
  expect(gran.container).toBe(ne);
  await game.handleTurnEnd();
  expect(gran.container).toBe(nw);
});

test("Movement can produce text", async () => {
  const text = new CyclicText("one", "two", "three");
  createRoute(gran, true, false, text, "s", "e", "n", "w");
  await game.handleTurnEnd();
  expect(getCurrentPage().includes("one")).toBeTruthy();
  await game.handleTurnEnd();
  expect(getCurrentPage().includes("two")).toBeTruthy();
  await game.handleTurnEnd();
  expect(getCurrentPage().includes("three")).toBeTruthy();
});
