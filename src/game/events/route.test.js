import { Route } from "./route";
import { TIMEOUT_TURNS } from "./event";
import Room from "../items/room";
import { initStore } from "../../redux/store";
import { Npc } from "../items/npc";
import { CyclicText } from "../interactions/text";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { newGame } from "../../redux/gameActions";
import { addSchedule, initGame } from "../../gonorth";
import { handleTurnEnd } from "../../utils/lifecycle";

jest.mock("../../utils/consoleIO");

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
  addSchedule(route);
  return route;
}

function getCurrentPage() {
  return getStore().getState().game.interaction.currentPage;
}

beforeEach(() => {
  unregisterStore();
  initStore();
  game = initGame("", false);
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
  await handleTurnEnd();
  expect(gran.container).toBe(sw);
  await handleTurnEnd();
  expect(gran.container).toBe(se);
  await handleTurnEnd();
  expect(gran.container).toBe(ne);
  await handleTurnEnd();
  expect(gran.container).toBe(nw);
});

test("Movement can produce text", async () => {
  const text = new CyclicText("one", "two", "three");
  createRoute(gran, true, false, text, "s", "e", "n", "w");
  await handleTurnEnd();
  expect(getCurrentPage().includes("one")).toBeTruthy();
  await handleTurnEnd();
  expect(getCurrentPage().includes("two")).toBeTruthy();
  await handleTurnEnd();
  expect(getCurrentPage().includes("three")).toBeTruthy();
});

test("Encounter triggers when NPC happens upon player", async () => {
  createRoute(gran, true, false, null, "s", "e");
  game.room = sw;
  gran.addEncounter("Hello!");
  await handleTurnEnd();
  expect(getCurrentPage().includes("Hello!")).toBeTruthy();
});
