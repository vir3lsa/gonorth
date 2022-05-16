import { Action, ActionChain } from "./actionChain";
import { getStore } from "../redux/storeRegistry";
import { Option } from "../game/interactions/option";
import { Verb } from "../game/verbs/verb";
import { selectCurrentPage, selectOptions } from "./testSelectors";
import { changeInteraction, newGame } from "../redux/gameActions";
import { initGame, Interaction, SequentialText } from "../gonorth";
import { deferAction } from "./testFunctions";

// Prevent console logging
jest.mock("../utils/consoleIO");
const consoleIO = require("../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

initGame("test", "", { debugMode: false });

const clickNext = () => {
  let res;
  const nextPromise = new Promise((resolve) => (res = resolve));
  setTimeout(() => {
    selectOptions()[0].action();
    res();
  });
  return nextPromise;
};

beforeEach(() => {
  getStore().dispatch(changeInteraction(new Interaction("")));
});

test("action chain ends early if action fails", async () => {
  let x = 1;
  const chain = new ActionChain(
    (helper) => {
      x++;
      helper.fail();
    },
    () => (x *= 3)
  );
  await chain.chain();
  expect(x).toBe(2);
});

test("multiple new actions can be inserted at the beginning", async () => {
  let x = 1;
  const chain = new ActionChain(
    () => x++,
    () => x++
  );
  chain.insertActions(
    () => (x *= -1),
    () => (x *= 2)
  );
  await chain.chain();
  expect(x).toBe(0);
});

test("Options are rendered even if chain produces no text", async () => {
  let x = 1;
  const chain = new ActionChain(() => x++);
  chain.options = new Option("one");
  await chain.chain();
  expect(selectOptions()[0].label).toBe("one");
});

test("Options are shown if attempting verb", async () => {
  let x = 1;
  const doIt = new Verb("do it", true, () => x++);
  const chain = new ActionChain(() => doIt.attempt());
  chain.options = new Option("one");
  await chain.chain();
  expect(selectOptions()[0].label).toBe("one");
});

test("Options are propagated if requested", async () => {
  getStore().dispatch(changeInteraction(new Interaction("options", [new Option("one")])));
  expect(selectOptions()[0].label).toBe("one");
  const chain = new ActionChain("still options");
  chain.propagateOptions = true;
  await chain.chain();
  expect(selectCurrentPage()).toInclude("still options");
  expect(selectOptions()[0].label).toBe("one"); // Expect options to still be there after chain.
});

test("Nested functions will be called until a value is returned", async () => {
  const chain = new ActionChain(() => () => () => () => (_, value) => `The value is ${value}`);
  await chain.chain(null, null, 42);
  expect(selectCurrentPage()).toInclude("The value is 42");
});

test("Options are added at the end of the chain", async () => {
  const chain = new ActionChain("one", "two");
  chain.options = [new Option("alpha"), new Option("beta")];
  chain.chain();
  await clickNext();
  expect(selectOptions()[0].label).toBe("alpha");
  expect(selectOptions()[1].label).toBe("beta");
});

test("Arrays are treated as nested ActionChains", async () => {
  const chain = new ActionChain("one", ["two", () => "three", new SequentialText("four")], "five");
  chain.chain();
  expect(selectCurrentPage()).toInclude("one");
  expect(selectCurrentPage()).not.toInclude("two");
  await clickNext();
  expect(selectCurrentPage()).toInclude("two");
  expect(selectCurrentPage()).not.toInclude("three");
  await clickNext();
  expect(selectCurrentPage()).toInclude("three");
  expect(selectCurrentPage()).not.toInclude("four");
  await clickNext();
  expect(selectCurrentPage()).toInclude("four");
  expect(selectCurrentPage()).not.toInclude("five");
  await clickNext();
  await deferAction(() => expect(selectCurrentPage()).toInclude("five"));
});

test("Empty values do not produce Next buttons", async () => {
  const chain = new ActionChain(
    "one",
    null,
    undefined,
    () => null,
    () => undefined,
    "two"
  );
  chain.chain();
  expect(selectCurrentPage()).toInclude("one");
  expect(selectCurrentPage()).not.toInclude("two");
  await clickNext();
  await deferAction(() => expect(selectCurrentPage()).toInclude("two"));
});

test("Empty strings do not produce Next buttons", async () => {
  // But should they?
  const chain = new ActionChain("one", "", () => "", "two");
  chain.chain();
  expect(selectCurrentPage()).toInclude("one");
  expect(selectCurrentPage()).not.toInclude("two");
  await clickNext();
  await deferAction(() => expect(selectCurrentPage()).toInclude("two"));
});

test("Options are displayed after nested action chains", async () => {
  const chain = new ActionChain(["one"]);
  chain.options = [new Option("cats"), new Option("dogs")];
  await chain.chain();
  expect(selectCurrentPage()).toInclude("one");
  expect(selectOptions()[0].label).toBe("cats");
  expect(selectOptions()[1].label).toBe("dogs");
});

test("Options are displayed after nested action chains containing SequentialTexts", async () => {
  const chain = new ActionChain([new SequentialText("one", "two")]);
  chain.options = [new Option("cats"), new Option("dogs")];
  const prom = chain.chain();
  await clickNext();
  await prom;
  expect(selectCurrentPage()).toInclude("one");
  expect(selectCurrentPage()).toInclude("two");
  expect(selectOptions()[0].label).toBe("cats");
  expect(selectOptions()[1].label).toBe("dogs");
});

test("Options are displayed after nested action chains containing functions returning SequentialTexts", async () => {
  const chain = new ActionChain([() => new SequentialText("one", "two")]);
  chain.options = [new Option("cats"), new Option("dogs")];
  const prom = chain.chain();
  await clickNext();
  await prom;
  expect(selectCurrentPage()).toInclude("one");
  expect(selectCurrentPage()).toInclude("two");
  expect(selectOptions()[0].label).toBe("cats");
  expect(selectOptions()[1].label).toBe("dogs");
});

test("A Next button isn't added after a nested action chain if there are already options", async () => {
  let x = 0;
  const chain = new ActionChain("one", [() => x++], "two");
  chain.chain();
  await clickNext();
  await deferAction(() => expect(selectCurrentPage()).toInclude("two"));
});

test("A Next button isn't added after a nested action chain if it already added one", async () => {
  let x = 0;
  const chain = new ActionChain("one", ["two", () => x++], "three");
  chain.chain();
  expect(selectCurrentPage()).toInclude("one");
  await clickNext();
  expect(selectCurrentPage()).toInclude("two");
  await clickNext();
  await deferAction(() => expect(selectCurrentPage()).toInclude("three"));
});

test("A Next button isn't added after a nested action chain if one isn't required", async () => {
  let x = 0;
  const chain = new ActionChain(() => x++, [() => x++], "two");
  chain.chain();
  await deferAction(() => expect(selectCurrentPage()).toInclude("two"));
});

// A function reused by the next series of tests that check a Next button is rendered in various circumstances.
const nextButtonTest = async (chain) => {
  chain.chain();
  expect(selectCurrentPage()).not.toInclude("two");
  await deferAction(() => expect(selectOptions()[0].label).toBe("Next"));
  await clickNext();
  await deferAction(() => expect(selectCurrentPage()).toInclude("two"));
};

test("A next button is added after a nested action chain whose last action produces a string", async () =>
  nextButtonTest(new ActionChain([() => null, "one"], "two")));

test("A next button is added after a nested action chain whose last action produces a Text", async () =>
  nextButtonTest(new ActionChain([() => null, new SequentialText("one")], "two")));

test("A next button is added after a nested action chain whose last action produces an Interaction", async () =>
  nextButtonTest(new ActionChain([() => null, new Interaction("one")], "two")));

test("A next button is added after a nested action chain whose last action produces an function", async () =>
  nextButtonTest(new ActionChain([() => null, () => "one"], "two")));

test("Individual actions can be forced not to produce Next buttons", async () => {
  const chain = new ActionChain("one", new Action("two", false), "three");
  chain.chain();
  expect(selectCurrentPage()).not.toInclude("two");
  await clickNext();
  expect(selectOptions()).toBeNull();
  await deferAction(() => expect(selectCurrentPage()).toInclude("two\n\nthree"));
});
