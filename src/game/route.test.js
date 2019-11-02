import { Route } from "./route";
import { TIMEOUT_TURNS } from "./event";
import Room from "./room";
import { initStore } from "../redux/store";
import { Npc } from "./npc";
import { parsePlayerInput } from "./parser";
import { getStore } from "../redux/storeRegistry";
import { newGame } from "../redux/gameActions";
import Game from "./game";

initStore();

const nw = new Room("nw");
const sw = new Room("sw");
const se = new Room("se");
const ne = new Room("ne");

let game;

nw.setSouth(sw);
sw.setEast(se);
se.setNorth(ne);
ne.setWest(nw);

const gran = new Npc("gran");
nw.addItem(gran);

function createRoute(subject, condition, continueOnFail, ...directions) {
  const routeBuilder = new Route.Builder()
    .withSubject(subject)
    .withCondition(condition)
    .withContinueOnFail(continueOnFail);

  directions.forEach((direction, index) => {
    routeBuilder
      .go(direction)
      .withDelay(index === 0 ? 0 : 1) // No delay to start, then delay of 1 turn
      .withDelayType(TIMEOUT_TURNS);
  });

  const route = routeBuilder.build();
  game.addSchedule(route);
  return route;
}

beforeEach(() => {
  game = new Game();
});

test("routes can be built", () => {
  createRoute(null, true, false, "north");
});

test("NPCs can follow routes", async () => {
  createRoute(gran, true, false, "s", "e", "n", "w");
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
