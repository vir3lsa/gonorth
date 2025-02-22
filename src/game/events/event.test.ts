import { AWAITING_COUNTDOWN_AND_TIMER, AWAITING_TIMER, DORMANT, Event, SUCCEEDED, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { handleTurnEnd } from "../../utils/lifecycle";
import gn, { addEvent } from "../../gonorth";
import { changeInteraction } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import { Option } from "../interactions/option";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { SequentialText } from "../interactions/text";
import { clickNextAndWait, deferAction } from "../../utils/testFunctions";
import { AnyAction } from "redux";

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

test("events execute at turn end when timeout is reached", async () => {
  addEvent(new Event.Builder("test").withAction(() => x++));
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("events may be built with a builder and multiple actions may be added", async () => {
  addEvent(
    new Event.Builder("test")
      .withAction(() => x++)
      .withAction(() => x++)
      .withCondition(true)
      .withDelayTurns(0)
  );
  await handleTurnEnd();
  expect(x).toBe(3);
});

test("builders may add multiple actions at once", async () => {
  addEvent(
    new Event.Builder("test")
      .withActions(
        () => x++,
        () => x++
      )
      .withCondition(true)
      .withDelayTurns(0)
  );
  await handleTurnEnd();
  expect(x).toBe(3);
});

test("options return after an event adds text", async () => {
  await getStore().dispatch(changeInteraction(new Interaction("some text", [new Option("one")])) as AnyAction);
  expect(selectOptions()[0].label).toBe("one");
  addEvent(new Event.Builder("test").withAction("hello"));
  await handleTurnEnd();
  expect(selectCurrentPage()).toInclude("hello");
  expect(selectOptions()[0].label).toBe("one");
});

test("options return after an event adds a next button", async () => {
  await getStore().dispatch(changeInteraction(new Interaction("hello", [new Option("one")])) as AnyAction);
  expect(selectOptions()[0].label).toBe("one");
  addEvent(new Event.Builder("test").withAction(new SequentialText("alpha", "beta")));
  const turnEndPromise = handleTurnEnd();
  setTimeout(async () => await clickNextAndWait());
  await turnEndPromise;
  expect(selectCurrentPage()).toInclude("alpha");
  expect(selectCurrentPage()).toInclude("beta");
  return deferAction(() => expect(selectOptions()[0].label).toBe("one"));
});

test("events may be reset", async () => {
  const event = new Event.Builder("test")
    .withAction(() => x++)
    .withDelayTurns(1)
    .build();
  addEvent(event);
  await handleTurnEnd();
  expect(x).toBe(1);
  event.reset();
  await handleTurnEnd();
  expect(x).toBe(1);
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("events may be cancelled", async () => {
  const event = new Event.Builder("test")
    .withAction(() => x++)
    .withDelayTurns(1)
    .build();
  addEvent(event);
  await handleTurnEnd();
  expect(x).toBe(1);
  event.cancel();
  await handleTurnEnd();
  expect(x).toBe(1);
  await handleTurnEnd();
  expect(x).toBe(1);
});

test("events may be reset after being cancelled", async () => {
  const event = new Event.Builder("test")
    .withAction(() => x++)
    .withDelayTurns(1)
    .build();
  addEvent(event);
  await handleTurnEnd();
  expect(x).toBe(1);
  event.cancel();
  event.reset();
  await handleTurnEnd();
  expect(x).toBe(1);
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("events may perform additional actions after completing", async () => {
  let x = 0;
  addEvent(
    new Event.Builder("happen")
      .withActions(
        () => x++,
        () => (x += 2)
      )
      .withOnComplete(() => (x *= 2))
      .withOnComplete(() => (x += 5))
      .build()
  );
  await handleTurnEnd();
  expect(x).toBe(11);
});

test("trigger conditions cause events to reset when not met", async () => {
  let z = 0;
  let y = 1;
  let triggered = false;
  addEvent(
    new Event.Builder("triggerCondition")
      .withAction(() => (triggered = true))
      .withCondition(() => z === 0)
      .withTriggerCondition(() => y === 0)
  );
  await handleTurnEnd(); // Event commences but does not trigger.
  expect(triggered).toBe(false);
  z = 1;
  y = 0;
  await handleTurnEnd(); // Event can't commence.
  expect(triggered).toBe(false);
  z = 0;
  await handleTurnEnd(); // Event commences and triggers.
  expect(triggered).toBe(true);
});

test("trigger conditions cause timer-style events to reset when not met", async () => {
  let y = 1;
  let triggered = false;
  const event = new Event.Builder("timerTriggerCondition")
    .withAction(() => (triggered = true))
    .withCondition(true)
    .withTriggerCondition(() => y === 0)
    .withDelayMillis(250)
    .build();
  addEvent(event);
  await handleTurnEnd(); // Event commences but does not trigger.
  expect(triggered).toBe(false);
  expect(event.timeoutId).toBeDefined();
  expect(event.state).toBe(AWAITING_TIMER);

  // Wait for the timer to finish and the state to change.
  while (event.state === AWAITING_TIMER) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Event has now reset.
  expect(event.state).toBe(DORMANT);
  expect(event.timeoutId).toBeUndefined();
  expect(triggered).toBe(false);
});

test("events with both delay types may trigger from a timer", async () => {
  let x = 0;
  const event = new Event.Builder("both1")
    .withAction(() => x++)
    .withDelayMillis(50)
    .withDelayTurns(1)
    .build();
  addEvent(event);
  await handleTurnEnd(); // Event commences but does not trigger'
  expect(x).toBe(0);

  // Wait for the timer to finish and the state to change.
  while (event.state === AWAITING_COUNTDOWN_AND_TIMER) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  expect(x).toBe(1);

  // Even doesn't trigger a second time.
  await handleTurnEnd();
  expect(x).toBe(1);
});

test("events with both delay types may trigger from a countdown", async () => {
  let x = 0;
  addEvent(
    new Event.Builder("both2")
      .withAction(() => x++)
      .withDelayMillis(50)
      .withDelayTurns(1)
  );
  await handleTurnEnd(); // Event commences but does not trigger'
  expect(x).toBe(0);

  await handleTurnEnd();
  expect(x).toBe(1);

  // Even doesn't trigger a second time.
  await handleTurnEnd();
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(x).toBe(1);
});

test("turn delays may be functions", async () => {
  addEvent(new Event.Builder("funcTurns").withAction(() => x++).withDelayTurns(({ event }) => event.executionCount ? 5 : 1).isRecurring());
  await handleTurnEnd(); // Event commences but does not trigger
  expect(x).toBe(1);
  await handleTurnEnd();
  expect(x).toBe(2);
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("time delays may be functions", async () => {
  addEvent(new Event.Builder("funcTime").withAction(() => x++).withDelayMillis(({ event }) => event.executionCount ? 500 : 1).isRecurring());
  await handleTurnEnd(); // Event commences but does not trigger
  expect(x).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 2));
  expect(x).toBe(2);
  await new Promise((resolve) => setTimeout(resolve, 2));
  expect(x).toBe(2);
});

test("events may be created with no actions", async () => {
  const noop = new Event.Builder("noop").build();
  addEvent(noop);
  await handleTurnEnd();
  expect(noop.state).toBe(SUCCEEDED);
});
