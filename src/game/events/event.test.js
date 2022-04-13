import { Event } from "./event";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import { handleTurnEnd } from "../../utils/lifecycle";
import { addEvent, addSchedule, initGame } from "../../gonorth";
import { changeInteraction } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import { Option } from "../interactions/option";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { getStore } from "../../redux/storeRegistry";
import { SequentialText } from "../interactions/text";
import { clickNextAndWait, deferAction } from "../../utils/testFunctions";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let x;

beforeEach(() => {
  initGame("", "", { debugMode: false });
  x = 1;
});

test("events execute at turn end when timeout is reached", async () => {
  addEvent(new Event("test", () => x++, true, 0, TIMEOUT_TURNS));
  await handleTurnEnd();
  expect(x).toBe(2);
});

test("options return after an event adds text", async () => {
  await getStore().dispatch(changeInteraction(new Interaction("some text", [new Option("one")])));
  expect(selectOptions()[0].label).toBe("one");
  addEvent(new Event("test", "hello", true, 0, TIMEOUT_TURNS));
  await handleTurnEnd();
  expect(selectCurrentPage()).toInclude("hello");
  expect(selectOptions()[0].label).toBe("one");
});

test("options return after an event adds a next button", async () => {
  await getStore().dispatch(changeInteraction(new Interaction("hello", [new Option("one")])));
  expect(selectOptions()[0].label).toBe("one");
  addEvent(new Event("test", new SequentialText("alpha", "beta"), true, 0, TIMEOUT_TURNS));
  const turnEndPromise = handleTurnEnd();
  setTimeout(async () => await clickNextAndWait());
  await turnEndPromise;
  expect(selectCurrentPage()).toInclude("alpha");
  expect(selectCurrentPage()).toInclude("beta");
  deferAction(() => expect(selectOptions()[0].label).toBe("one"));
});
