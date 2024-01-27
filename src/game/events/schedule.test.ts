import { Schedule, ScheduleBuilder } from "./schedule";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { handleTurnEnd } from "../../utils/lifecycle";
import { addSchedule, initGame } from "../../gonorth";
import { unregisterStore } from "../../redux/storeRegistry";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let x: number;

beforeEach(() => {
  unregisterStore();
  initGame("", "", { debugMode: false });
  x = 1;
});

function createBuilder(condition: boolean | Condition, continueOnFail: boolean) {
  return new Schedule.Builder().withCondition(condition).withContinueOnFail(continueOnFail);
}

function addEvent(builder: ScheduleBuilder, delay: number, delayType: TimeoutType, ...actions: Action[]) {
  builder.addEvent(...actions).withDelay(delay, delayType);
}

function buildAndExecute(builder: ScheduleBuilder) {
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

test("schedules don't reset by default", async () => {
  const builder = createBuilder(false, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  const schedule = builder.build();
  await schedule.commence();
  expect(x).toBe(2);
  await schedule.commence();
  expect(x).toBe(2); // Still 2
});

test("schedules may be manually reset", async () => {
  const builder = createBuilder(false, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  const schedule = builder.build();
  await schedule.commence();
  expect(x).toBe(2);
  schedule.reset();
  await schedule.commence();
  expect(x).toBe(3);
});

test("schedules may reset if necessary", async () => {
  const builder = createBuilder(false, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  const schedule = builder.build();
  await schedule.commence();
  expect(x).toBe(2);
  await schedule.commence(true);
  expect(x).toBe(3);
});
