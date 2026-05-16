import { Route } from "./route";
import { TIMEOUT_TURNS } from "./event";
import { Room } from "../items/room";
import { Npc } from "../items/npc";
import { CyclicText } from "../interactions/text";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { changeRoom } from "../../redux/gameActions";
import gn from "../../gonorth";
import { handleTurnEnd } from "../../utils/lifecycle";
import { selectCurrentPage } from "../../utils/testSelectors";
import { Condition, RouteT, UnknownText } from "../../types/types";

jest.mock("../../utils/consoleIO");

let nw: Room;
let sw: Room;
let se: Room;
let ne: Room;
let gran: Npc;

function createRoute(
  subject: Npc,
  condition: boolean | Condition,
  continueOnFail: boolean,
  text: UnknownText = "",
  ...directions: string[]
) {
  const routeBuilder = new Route.Builder("routeTest")
    .withSubject(subject)
    .withCondition(condition)
    .withContinueOnFail(continueOnFail);

  directions.forEach((direction, index) => {
    routeBuilder
      .go(direction)
      .withDelayTurns(index === 0 ? 0 : 1) // No delay to start, then delay of 1 turn
      .withText(text);
  });

  const route = routeBuilder.build();
  gn.addSchedule(route);
  return route;
}

beforeEach(() => {
  unregisterStore();
  gn.init({ title: "", goToTitleScreen: false });

  nw = new Room.Builder("nw").build();
  sw = new Room.Builder("sw").build();
  se = new Room.Builder("se").build();
  ne = new Room.Builder("ne").build();

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
  expect(gran.container?.name).toBe(nw.name);
  await handleTurnEnd();
  expect(gran.container?.name).toBe(sw.name);
  await handleTurnEnd();
  expect(gran.container?.name).toBe(se.name);
  await handleTurnEnd();
  expect(gran.container?.name).toBe(ne.name);
  await handleTurnEnd();
  expect(gran.container?.name).toBe(nw.name);
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
