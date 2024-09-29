import { Schedule, ScheduleBuilder } from "./schedule";
import { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
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
  return new Schedule.Builder("scheduleTest").withCondition(condition).withContinueOnFail(continueOnFail);
}

function addEvent(builder: ScheduleBuilder, delay: number, delayType: TimeoutType, ...actions: Action[]) {
  builder.addEvent(
    new Event.Builder()
      .withActions(...actions)
      .withTimeout(delay)
      .withTimeoutType(delayType)
  );
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
  const builder = createBuilder(true, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  await buildAndExecute(builder);
  expect(x).toBe(2);
  await handleTurnEnd();
  expect(x).toBe(2); // Still 2
});

test("schedules may be manually reset", async () => {
  const builder = createBuilder(true, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  const schedule = builder.build();
  addSchedule(schedule);
  await handleTurnEnd();
  expect(x).toBe(2);
  schedule.reset();
  await handleTurnEnd();
  expect(x).toBe(3);
});

test("schedules may triggered and reset manually", async () => {
  const builder = createBuilder(false, false);
  addEvent(builder, 0, TIMEOUT_TURNS, () => x++);
  const schedule = builder.build();
  addSchedule(schedule);
  await schedule.commence();
  await handleTurnEnd();
  expect(x).toBe(2);
  await schedule.commence(true);
  await handleTurnEnd();
  expect(x).toBe(3);
});

test("individual events may have conditions", async () => {
  const builder = createBuilder(true, false);
  builder.addEvent(new Event.Builder().withCondition(() => x > 5).withAction(() => (x = 100)));
  await buildAndExecute(builder);
  expect(x).toBe(1); // Event's condition not met.
  x = 10;
  await handleTurnEnd();
  expect(x).toBe(100); // Condition met.
});

test("multiple events may be added at once", async () => {
  let x = 0;
  const builder = createBuilder(true, false);
  builder.addEvents(
    new Event.Builder().withAction(() => x++),
    new Event.Builder().withAction(() => x++)
  );
  await buildAndExecute(builder);
  expect(x).toBe(2);
});
