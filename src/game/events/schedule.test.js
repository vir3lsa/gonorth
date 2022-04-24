import { Schedule } from "./schedule";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { handleTurnEnd } from "../../utils/lifecycle";
import { addSchedule, initGame } from "../../gonorth";
import { unregisterStore } from "../../redux/storeRegistry";
import { initStore } from "../../redux/store";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let x;

beforeEach(() => {
  unregisterStore();
  initStore();
  initGame("", "", { debugMode: false });
  x = 1;
});

function createBuilder(condition, continueOnFail) {
  return new Schedule.Builder()
    .withCondition(condition)
    .withContinueOnFail(continueOnFail);
}

function addEvent(builder, delay, delayType, ...actions) {
  builder.addEvent(...actions).withDelay(delay, delayType);
}

function buildAndExecute(builder) {
  const schedule = builder.build();
  addSchedule(schedule);
  return handleTurnEnd();
}

test("schedule can be built", () => {
  const builder = createBuilder(true, false);
  addEvent(builder, 10, TIMEOUT_MILLIS, () => x++);
  builder.build();
});

test("schedule executes", async () => {
  const builder = createBuilder(true, false);
  addEvent(builder, 0, TIMEOUT_MILLIS, () => x++);
  await buildAndExecute(builder);
  expect(x).toBe(2);
});

test("multiple events execute", async () => {
  const builder = createBuilder(true, false);
  addEvent(builder, 0, TIMEOUT_MILLIS, () => x++);
  addEvent(builder, 0, TIMEOUT_TURNS, () => (x *= 3));
  await buildAndExecute(builder);
  expect(x).toBe(6);
});

test("failed action stops schedule", async () => {
  const builder = createBuilder(true, false);
  addEvent(builder, 0, TIMEOUT_MILLIS, () => {
    x++;
    return false; // Indicates fail
  });
  addEvent(builder, 0, TIMEOUT_TURNS, () => (x *= 3));
  await buildAndExecute(builder);
  expect(x).toBe(2);
});

test("failed action does not stop schedule if configured", async () => {
  const builder = createBuilder(true, true);
  addEvent(builder, 0, TIMEOUT_MILLIS, () => {
    x++;
    return false; // Indicates fail
  });
  addEvent(builder, 0, TIMEOUT_TURNS, () => (x *= 3));
  await buildAndExecute(builder);
  expect(x).toBe(6);
});

test("schedule can be cancelled", async () => {
  const builder = createBuilder(true, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  addEvent(builder, 1, TIMEOUT_TURNS, () => (x *= 3));
  const schedule = builder.build();
  addSchedule(schedule);
  await handleTurnEnd();
  schedule.cancel();
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("schedules can recur", async () => {
  const builder = createBuilder(true, false);
  builder.recurring();
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  addEvent(builder, 0, TIMEOUT_TURNS, () => (x *= 2));
  addSchedule(builder.build());
  await handleTurnEnd();
  await handleTurnEnd();
  expect(x).toBe(10);
});
