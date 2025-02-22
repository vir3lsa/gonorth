import { Schedule, ScheduleBuilder } from "./schedule";
import { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { handleTurnEnd } from "../../utils/lifecycle";
import gn, { addSchedule } from "../../gonorth";
import { unregisterStore } from "../../redux/storeRegistry";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let x: number;

beforeEach(() => {
  unregisterStore();
  gn.init({ title: "", goToTitleScreen: false });
  x = 1;
});

function createBuilder(condition: boolean | Condition, continueOnFail: boolean) {
  return new Schedule.Builder("scheduleTest").withCondition(condition).withContinueOnFail(continueOnFail);
}

function addTurnsEvent(builder: ScheduleBuilder, delayTurns: number, ...actions: Action[]) {
  builder.addEvent(new Event.Builder().withActions(...actions).withDelayTurns(delayTurns));
}

function addTimeEvent(builder: ScheduleBuilder, delayMillis: number, ...actions: Action[]) {
  builder.addEvent(new Event.Builder().withActions(...actions).withDelayMillis(delayMillis));
}

function buildAndExecute(builder: ScheduleBuilder) {
  const schedule = builder.build();
  addSchedule(schedule);
  return handleTurnEnd();
}

test("schedule can be built", () => {
  const builder = createBuilder(true, false);
  addTimeEvent(builder, 10, () => x++);
  builder.build();
});

test("schedule executes", async () => {
  const builder = createBuilder(true, false);
  addTimeEvent(builder, 0, () => x++);
  await buildAndExecute(builder);
  expect(x).toBe(2);
});

test("multiple events execute", async () => {
  const builder = createBuilder(true, false);
  addTimeEvent(builder, 0, () => x++);
  addTurnsEvent(builder, 0, () => (x *= 3));
  await buildAndExecute(builder);
  expect(x).toBe(6);
});

test("failed action stops schedule", async () => {
  const builder = createBuilder(true, false);
  addTimeEvent(builder, 0, () => {
    x++;
    return false; // Indicates fail
  });
  addTurnsEvent(builder, 0, () => (x *= 3));
  await buildAndExecute(builder);
  expect(x).toBe(2);
});

test("failed action does not stop schedule if configured", async () => {
  const builder = createBuilder(true, true);
  addTimeEvent(builder, 0, () => {
    x++;
    return false; // Indicates fail
  });
  addTurnsEvent(builder, 0, () => (x *= 3));
  await buildAndExecute(builder);
  expect(x).toBe(6);
});

test("schedule can be cancelled", async () => {
  const builder = createBuilder(true, false);
  addTurnsEvent(builder, 0, () => x++);
  addTurnsEvent(builder, 1, () => (x *= 3));
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
  addTurnsEvent(builder, 1, () => x++);
  addTurnsEvent(builder, 0, () => (x *= 2));
  addSchedule(builder.build());
  await handleTurnEnd();
  await handleTurnEnd();
  await handleTurnEnd();
  expect(x).toBe(10);
});

test("schedules don't recur by default", async () => {
  const builder = createBuilder(true, false);
  addTurnsEvent(builder, 0, () => x++);
  await buildAndExecute(builder);
  expect(x).toBe(2);
  await handleTurnEnd();
  expect(x).toBe(2); // Still 2
});

test("schedules may be manually reset", async () => {
  const builder = createBuilder(true, false);
  addTurnsEvent(builder, 0, () => x++);
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
  addTurnsEvent(builder, 0, () => x++);
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
  const builder = createBuilder(true, false);
  builder.addEvents(
    new Event.Builder().withAction(() => x++),
    new Event.Builder().withAction(() => x++)
  );
  await buildAndExecute(builder);
  expect(x).toBe(3);
});
