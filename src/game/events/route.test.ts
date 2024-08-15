import { Route } from "./route";
import { TIMEOUT_TURNS } from "./event";
import { Room } from "../items/room";
import { Npc } from "../items/npc";
import { CyclicText } from "../interactions/text";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { changeRoom } from "../../redux/gameActions";
import { addSchedule, initGame } from "../../gonorth";
import { handleTurnEnd } from "../../utils/lifecycle";
import { selectCurrentPage } from "../../utils/testSelectors";

jest.mock("../../utils/consoleIO");

let nw: Room;
let sw: Room;
let se: Room;
let ne: Room;
let game;
let gran: Npc;

function createRoute(
  subject: Npc,
  condition: boolean | Condition,
  continueOnFail: boolean,
  text: UnknownText = "",
  ...directions: string[]
) {
  const routeBuilder = new Route.Builder()
    .withSubject(subject)
    .withCondition(condition)
    .withContinueOnFail(continueOnFail);

  directions.forEach((direction, index) => {
    routeBuilder
      .go(direction)
      .withDelay(index === 0 ? 0 : 1, TIMEOUT_TURNS) // No delay to start, then delay of 1 turn
      .withText(text);
  });

  const route = routeBuilder.build();
  addSchedule(route);
  return route;
}

beforeEach(() => {
  unregisterStore();
  game = initGame("", "", { debugMode: false });

  nw = new Room("nw");
  sw = new Room("sw");
  se = new Room("se");
  ne = new Room("ne");

  nw.setSouth(sw);
  sw.setEast(se);
  se.setNorth(ne);
  ne.setWest(nw);

  gran = new Npc.Builder("gran").withDescription("wiley").build();
  nw.addItem(gran);
});

test("routes can be built", () => {
  createRoute(new Npc.Builder("badger").withDescription("stripey").build(), true, false, undefined, "north");
});

test("NPCs can follow routes", async () => {
  createRoute(gran, true, false, undefined, "s", "e", "n", "w");
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
  expect(selectCurrentPage().includes("one")).toBeTruthy();
  await handleTurnEnd();
  expect(selectCurrentPage().includes("two")).toBeTruthy();
  await handleTurnEnd();
  expect(selectCurrentPage().includes("three")).toBeTruthy();
});

test("Encounter triggers when NPC happens upon player", async () => {
  createRoute(gran, true, false, undefined, "s", "e");
  getStore().dispatch(changeRoom(sw));
  gran.addEncounter("Hello!");
  await handleTurnEnd();
  expect(selectCurrentPage().includes("Hello!")).toBeTruthy();
});
