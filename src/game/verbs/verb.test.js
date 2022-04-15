import { getStore } from "../../redux/storeRegistry";
import { Verb, newVerb } from "./verb";
import { newGame, changeInteraction } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import {
  CyclicText,
  SequentialText,
  RandomText,
  PagedText
} from "../interactions/text";
import { Option } from "../interactions/option";
import { selectCurrentPage, selectInteraction } from "../../utils/testSelectors";
import { initGame } from "../../gonorth";
import { clickNext, clickNextAndWait, deferAction } from "../../utils/testFunctions";
import { selectVerbNames } from "../../utils/selectors";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let y;
let verb;

const storeHasVerb = (verbName) => selectVerbNames()[verbName];

// Prevent console logging
getStore().dispatch(newGame(initGame("test", "", { debugMode: false }), true, false));

beforeEach(() => {
  verb = new Verb(
    "twirl",
    (helper, x) => x > 2,
    [(helper, x) => (y = x + 1), "You twirl beautifully"],
    "You fall over",
    ["spin", "rotate"]
  );
  y = 0;
  getStore().dispatch(changeInteraction(new Interaction("")));
});

it("prints the failure text if the test fails", () => {
  verb.attempt(1);
  expect(selectCurrentPage()).toBe("You fall over");
});

it("prints the success text if the test succeeds", async () => {
  await verb.attempt(3);
  expect(selectCurrentPage()).toBe("You twirl beautifully");
});

it("does not perform the action if the test fails", () => {
  verb.attempt(1);
  expect(y).toBe(0);
});

it("performs the action if the test passes", () => {
  verb.attempt(3);
  expect(y).toBe(4);
});

it("adds verb names and aliases to the global registry", () => {
  new Verb("examine", true, [], [], ["look at", "inspect"]);
  expect(storeHasVerb("twirl")).toBeTruthy();
  expect(storeHasVerb("spin")).toBeTruthy();
  expect(storeHasVerb("rotate")).toBeTruthy();
  expect(storeHasVerb("look at")).toBeTruthy();
  expect(storeHasVerb("inspect")).toBeTruthy();
});

it("adds new aliases to the global registry", () => {
  verb.addAliases(["twist", "twizzle"]);
  expect(storeHasVerb("twist")).toBeTruthy();
  expect(storeHasVerb("twizzle")).toBeTruthy();
});

describe("chainable actions", () => {
  it("supports cyclic text", async () => {
    verb.onSuccess = new CyclicText("a", "b", "c");
    await verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await verb.attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb");
    await verb.attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc");
    await verb.attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc\n\na");
  });

  it("supports sequential text", async () => {
    verb.onSuccess = new SequentialText("a", "b", "c");
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await clickNextAndWait();
    expect(selectCurrentPage()).toInclude("b");
    await clickNextAndWait();
    expect(selectCurrentPage()).toInclude("c");
    await promise;
  });

  it("supports paged text", async () => {
    verb.onSuccess = new PagedText("a", "b", "c");
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await clickNextAndWait();
    expect(selectCurrentPage()).toBe("b");
    await clickNextAndWait();
    expect(selectCurrentPage()).toBe("c");
    await promise;
  });

  it("supports sequential text earlier in the chain", async () => {
    let pass = false;
    verb.onSuccess = [new PagedText("a", "b"), () => (pass = true)];
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await clickNextAndWait();
    expect(selectCurrentPage()).toBe("b");
    clickNext();
    await promise;
    expect(pass).toBeTruthy();
  });

  it("supports sequential text followed by normal text", async () => {
    verb.onSuccess = [new PagedText("a", "b"), "c"];
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await clickNextAndWait();
    expect(selectCurrentPage()).toBe("b");
    clickNext();
    await promise;
    expect(selectCurrentPage().includes("c")).toBe(true);
  });

  it("supports appending sequential text earlier in the chain", async () => {
    let pass = false;
    verb.onSuccess = [new SequentialText("a", "b"), () => (pass = true)];
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await clickNextAndWait();
    expect(selectCurrentPage().includes("b")).toBe(true);
    clickNext();
    await promise;
    expect(pass).toBeTruthy();
  });

  it("supports appending sequential text followed by normal text", async () => {
    verb.onSuccess = [new SequentialText("a", "b"), "c"];
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await clickNextAndWait();
    expect(selectCurrentPage().includes("b")).toBe(true);
    clickNext();
    await promise;
    expect(selectCurrentPage().includes("c")).toBe(true);
  });

  it("supports nested arrays as chained actions - nested arrays are sub-action-chains", async () => {
    verb.onSuccess = [["a", "b"], "c"];
    verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    expect(selectCurrentPage()).not.toInclude("b");
    await clickNextAndWait();
    expect(selectCurrentPage()).toInclude("b");
    expect(selectCurrentPage()).not.toInclude("c");
    await deferAction(async () => {
      await clickNextAndWait();
      expect(selectCurrentPage()).toInclude("c");
    });
  });

  it("cycles through messages", () => {
    verb.onSuccess = new CyclicText("a", "b", "c");
    verb.attempt(3);
    expect(selectCurrentPage()).toBe("a");
    verb.attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb");
    verb.attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc");
    verb.attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc\n\na");
  });

  it("selects random messages", () => {
    verb.onSuccess = new RandomText("x", "y", "z");
    verb.attempt(3);
    const page1 = selectCurrentPage();
    verb.attempt(3);
    const page2 = selectCurrentPage();
    verb.attempt(3);
    const page3 = selectCurrentPage();
    expect(page2).not.toEqual(page1);
    expect(page3).not.toEqual(page2);
  });

  it("Renders a Next button when the previous and next interactions do not", async () => {
    verb.onSuccess = ["blah", new Interaction("bob")];
    getStore().dispatch(changeInteraction(new Interaction("Previous interaction")));
    verb.attempt(3);
    expect(selectInteraction().options[0].label).toBe("Next");
  });

  it("Clears the page for paged text", async () => {
    verb.onSuccess = ["blah", new PagedText("jam")];
    const promise = verb.attempt(3);
    expect(selectCurrentPage()).toBe("blah");
    clickNext();
    await promise;
    expect(selectCurrentPage()).toBe("jam");
  });

  it("Does not render Next buttons forever", async () => {
    verb.onSuccess = new SequentialText("one", "two");
    verb.attempt(3);
    await clickNextAndWait();
    expect(selectInteraction().options).toBeNull();
  });

  it("Throws error if custom options in middle of chain", async () => {
    verb.onSuccess = [new Interaction("risky", new Option("Custom")), "Text"];
    try {
      await verb.attempt(3);
      throw Error("Expected Error not thrown");
    } catch (error) {
      expect(error.message).toEqual(expect.stringContaining("Custom options"));
    }
  });

  it("can be configured with a config object", () => {
    const verb = newVerb({
      name: "fly",
      aliases: ["levitate"],
      isKeyword: false
    });
    expect(verb.name).toBe("fly");
    expect(verb.aliases).toStrictEqual(["levitate"]);
    expect(verb.isKeyword).toBe(false);
  });

  it("succeeds with multiple tests", async () => {
    const verb = new Verb("jump", ["yes".length > 1, true !== false, (_, x) => x > 0], "you jump", "you fall");
    await verb.attempt(1);
    expect(selectCurrentPage()).toBe("you jump");
  });

  it("fails if just one test fails", async () => {
    const verb = new Verb("jump", ["yes".length > 1, true !== false, (_, x) => x > 0], "you jump", "you fall");
    await verb.attempt(0);
    expect(selectCurrentPage()).toBe("you fall");
  });
});
