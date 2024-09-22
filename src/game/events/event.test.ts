import { Event, TIMEOUT_TURNS } from "./event";
import { handleTurnEnd } from "../../utils/lifecycle";
import { addEvent, initGame } from "../../gonorth";
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
  initGame("", "", { debugMode: false });
  x = 1;
});

test("events execute at turn end when timeout is reached", async () => {
  addEvent(new Event("test", () => x++, true, 0, TIMEOUT_TURNS));
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("events may be built with a builder and multiple actions may be added", async () => {
  addEvent(
    new Event.Builder("test")
      .withAction(() => x++)
      .withAction(() => x++)
      .withCondition(true)
      .withTimeout(0)
      .withTimeoutType(TIMEOUT_TURNS)
      .build()
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
      .withTimeout(0)
      .withTimeoutType(TIMEOUT_TURNS)
      .build()
  );
  await handleTurnEnd();
  expect(x).toBe(3);
});

test("options return after an event adds text", async () => {
  await getStore().dispatch(changeInteraction(new Interaction("some text", [new Option("one")])) as AnyAction);
  expect(selectOptions()[0].label).toBe("one");
  addEvent(new Event("test", "hello", true, 0, TIMEOUT_TURNS));
  await handleTurnEnd();
  expect(selectCurrentPage()).toInclude("hello");
  expect(selectOptions()[0].label).toBe("one");
});

test("options return after an event adds a next button", async () => {
  await getStore().dispatch(changeInteraction(new Interaction("hello", [new Option("one")])) as AnyAction);
  expect(selectOptions()[0].label).toBe("one");
  addEvent(new Event("test", new SequentialText("alpha", "beta"), true, 0, TIMEOUT_TURNS));
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
    .withTimeout(1)
    .withTimeoutType(TIMEOUT_TURNS)
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
    .withTimeout(1)
    .withTimeoutType(TIMEOUT_TURNS)
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
    .withTimeout(1)
    .withTimeoutType(TIMEOUT_TURNS)
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
