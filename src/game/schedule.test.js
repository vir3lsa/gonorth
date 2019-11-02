import Game from "./game";
import { Schedule } from "./schedule";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { initStore } from "../redux/store";

let game, x;

initStore();

beforeEach(() => {
  game = new Game();
  x = 1;
});

function createBuilder(condition, continueOnFail) {
  return new Schedule.Builder()
    .withCondition(condition)
    .withContinueOnFail(continueOnFail);
}

function addEvent(builder, delay, delayType, ...actions) {
  builder
    .addEvent(...actions)
    .withDelay(delay)
    .withDelayType(delayType);
}

function buildAndExecute(builder) {
  const schedule = builder.build();
  game.addSchedule(schedule);
  return game.handleTurnEnd();
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
