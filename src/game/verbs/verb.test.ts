import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Verb, newVerb } from "./verb";
import { changeInteraction, changeRoom } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import { CyclicText, SequentialText, RandomText, PagedText } from "../interactions/text";
import { Option } from "../interactions/option";
import { selectCurrentPage, selectInteraction } from "../../utils/testSelectors";
import { addEffect, addWildcardEffect, initGame, moveItem } from "../../gonorth";
import { clickNext, clickNextAndWait, deferAction } from "../../utils/testFunctions";
import { selectEffects, selectInventory, selectVerbNames } from "../../utils/selectors";
import { Item } from "../items/item";
import { Room } from "../items/room";
import { checkAutoActions } from "../input/autoActionExecutor";
import { ActionChain } from "../../utils/actionChain";
import { AnyAction } from "redux";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

jest.mock("../input/autoActionExecutor", () => ({
  checkAutoActions: jest.fn(async () => true)
}));

const mockedAutoActionExecutor = jest.mocked(checkAutoActions);

// Get the thing we just mocked so we can check for calls on it.
const autoActionExecutor = require("../input/autoActionExecutor");

let y: number;
let verb: Verb;

const storeHasVerb = (verbName: string) => selectVerbNames()[verbName];

// Prevent console logging
initGame("test", "", { debugMode: false });
getStore().dispatch(changeRoom(new Room("hall")));

beforeEach(() => {
  verb = new Verb(
    "twirl",
    ({ x }) => (x as number) > 2,
    [({ x }) => (y = (x as number) + 1), "You twirl beautifully"],
    "You fall over",
    ["spin", "rotate"]
  );
  verb.expectedArgs = ["x"];
  y = 0;
  getStore().dispatch(changeInteraction(new Interaction("")) as AnyAction);
});

const attempt = (x: number) => verb.attempt(x);

it("prints the failure text if the test fails", async () => {
  await attempt(1);
  expect(selectCurrentPage()).toBe("You fall over");
});

it("prints the success text if the test succeeds", async () => {
  await attempt(3);
  expect(selectCurrentPage()).toBe("You twirl beautifully");
});

it("does not perform the action if the test fails", () => {
  attempt(1);
  expect(y).toBe(0);
});

it("performs the action if the test passes", async () => {
  await attempt(3);
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

it("may have multiple tests", async () => {
  let x = 1,
    y = 2,
    z = 3;
  const thwart = new Verb.Builder("thwart")
    .withTest(
      () => x > 0,
      () => y < 3
    )
    .withTest(() => z > 2)
    .withOnSuccess("yes")
    .withOnFailure("no")
    .build();

  await thwart.attempt();
  expect(selectCurrentPage()).toBe("yes");

  y = 5;
  getStore().dispatch(changeInteraction(new Interaction("")) as AnyAction);
  await thwart.attempt();
  expect(selectCurrentPage()).toBe("no");
});

describe("chainable actions", () => {
  it("supports cyclic text", async () => {
    verb.onSuccess = new CyclicText("a", "b", "c");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc\n\na");
  });

  it("supports sequential text", async () => {
    verb.onSuccess = new SequentialText("a", "b", "c");
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      await clickNextAndWait();
      expect(selectCurrentPage()).toInclude("b");
      await clickNextAndWait();
      expect(selectCurrentPage()).toInclude("c");
    });
    await attempt(3);
  });

  it("supports paged text", async () => {
    verb.onSuccess = new PagedText("a", "b", "c");
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      await clickNextAndWait();
      expect(selectCurrentPage()).toBe("b");
      await clickNextAndWait();
      expect(selectCurrentPage()).toBe("c");
    });
    await attempt(3);
  });

  it("supports sequential text earlier in the chain", async () => {
    let pass = false;
    verb.onSuccess = [new PagedText("a", "b"), () => (pass = true)];
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      await clickNextAndWait();
      expect(selectCurrentPage()).toBe("b");
      clickNext();
    });
    await attempt(3);
    expect(pass).toBeTruthy();
  });

  it("supports sequential text followed by normal text", async () => {
    verb.onSuccess = [new PagedText("a", "b"), "c"];
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      await clickNextAndWait();
      expect(selectCurrentPage()).toBe("b");
      clickNext();
    });
    await attempt(3);
    expect(selectCurrentPage().includes("c")).toBe(true);
  });

  it("supports appending sequential text earlier in the chain", async () => {
    let pass = false;
    verb.onSuccess = [new SequentialText("a", "b"), () => (pass = true)];
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      await clickNextAndWait();
      expect(selectCurrentPage().includes("b")).toBe(true);
      clickNext();
    });
    await attempt(3);
    expect(pass).toBeTruthy();
  });

  it("supports appending sequential text followed by normal text", async () => {
    verb.onSuccess = [new SequentialText("a", "b"), "c"];
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      await clickNextAndWait();
      expect(selectCurrentPage().includes("b")).toBe(true);
      clickNext();
    });
    await attempt(3);
    expect(selectCurrentPage().includes("c")).toBe(true);
  });

  it("supports nested arrays as chained actions - nested arrays are sub-action-chains", async () => {
    verb.onSuccess = [["a", "b"], "c"];
    setTimeout(async () => {
      expect(selectCurrentPage()).toBe("a");
      expect(selectCurrentPage()).not.toInclude("b");
      await clickNextAndWait();
      expect(selectCurrentPage()).toInclude("b");
      expect(selectCurrentPage()).not.toInclude("c");
      setTimeout(() => clickNext());
    });
    await attempt(3);
    expect(selectCurrentPage()).toInclude("c");
  });

  it("cycles through messages", async () => {
    verb.onSuccess = new CyclicText("a", "b", "c");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc");
    await attempt(3);
    expect(selectCurrentPage()).toBe("a\n\nb\n\nc\n\na");
  });

  it("selects random messages", async () => {
    verb.onSuccess = new RandomText("x", "y", "z");
    await attempt(3);
    const page1 = selectCurrentPage();
    await attempt(3);
    const page2 = selectCurrentPage();
    await attempt(3);
    const page3 = selectCurrentPage();
    expect(page2).not.toEqual(page1);
    expect(page3).not.toEqual(page2);
  });

  it("Renders a Next button when the previous and next interactions do not", async () => {
    verb.onSuccess = ["blah", new Interaction("bob")];
    getStore().dispatch(changeInteraction(new Interaction("Previous interaction")) as AnyAction);
    setTimeout(() => {
      expect(selectInteraction().options[0].label).toBe("Next");
      clickNext();
    });
    await attempt(3);
  });

  it("Clears the page for paged text", async () => {
    verb.onSuccess = ["blah", new PagedText("jam")];
    setTimeout(() => {
      expect(selectCurrentPage()).toBe("blah");
      clickNext();
    });
    await attempt(3);
    expect(selectCurrentPage()).toBe("jam");
  });

  it("Does not render Next buttons forever", async () => {
    verb.onSuccess = new SequentialText("one", "two");
    setTimeout(() => clickNextAndWait());
    await attempt(3);
    expect(selectInteraction().options).toBeUndefined();
  });

  it("Throws error if custom options in middle of chain", async () => {
    verb.onSuccess = [new Interaction("risky", new Option("Custom")), "Text"];
    try {
      await attempt(3);
      throw Error("Expected Error not thrown");
    } catch (error) {
      expect((error as Error).message).toEqual(expect.stringContaining("Custom options"));
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

  it("can be built with a builder", () => {
    const verb = new Verb.Builder("climb")
      .withAliases("boulder")
      .withDescription("up rocks")
      .withTest(true)
      .withOnSuccess("yes")
      .withOnFailure("no")
      .isKeyword()
      .isRemote()
      .expectsArgs()
      .build();

    expect(verb.name).toBe("climb");
    expect(verb.aliases).toEqual(["boulder"]);
    expect(verb.description).toBe("up rocks");
    expect(Array.isArray(verb.test)).toBe(true);
    expect(verb.onSuccess instanceof ActionChain).toBe(true);
    expect(verb.onFailure instanceof ActionChain).toBe(true);
    expect(verb.isKeyword).toBe(true);
    expect(verb.remote).toBe(true);
    expect(verb.expectsArgs).toBe(true);
  });

  it("succeeds with multiple tests", async () => {
    const verb = new Verb(
      "jump",
      [() => "yes".length > 1, () => true, ({ x }) => (x as number) > 0],
      "you jump",
      "you fall"
    );
    verb.expectedArgs = ["x"];
    await verb.attempt(1);
    expect(selectCurrentPage()).toBe("you jump");
  });

  it("fails if just one test fails", async () => {
    const verb = new Verb("jump", ["yes".length > 1, true, ({ z }) => (z as number) > 0], "you jump", "you fall");
    verb.expectedArgs = ["x", "y", "z"];
    await verb.attempt(null, null, 0);
    expect(selectCurrentPage()).toBe("you fall");
  });

  it("returns true when successful", async () => {
    const verb = new Verb("smile", true, "you grin");
    expect(await verb.attempt()).toBe(true);
  });

  it("returns false when unsuccessful", async () => {
    const verb = new Verb("frown", false, null, "you just can't do it");
    expect(await verb.attempt()).toBe(false);
  });

  it("gives a default message if the verb fails and the player doesn't have a holdable item", async () => {
    // The auto actions are mocked to return true here
    const verb = new Verb("squeeze", false, null, "won't happen");
    verb.attempt(new Item.Builder("ball").isHoldable().build());
    return deferAction(() => {
      expect(selectCurrentPage()).toInclude("not holding the ball");
      expect(selectCurrentPage()).not.toInclude("won't happen");
    });
  });

  it("doesn't continue if auto actions fail", async () => {
    // Mock the auto actions to return false for this test.
    mockedAutoActionExecutor.mockImplementationOnce(async () => false);
    const verb = new Verb("throw", false, null, "won't happen");
    verb.attempt(new Item.Builder("beanbag").isHoldable().build());
    return deferAction(() => {
      expect(selectCurrentPage()).not.toInclude("not holding the beanbag");
      expect(selectCurrentPage()).not.toInclude("won't happen");
    });
  });

  describe("effects", () => {
    let egg: Item, bat: Item;

    beforeEach(() => {
      unregisterStore();
      initGame("test", "", { debugMode: false });
      selectEffects().effects = {};

      egg = new Item.Builder("egg")
        .isHoldable()
        .withVerbs(
          new Verb.Builder("hit")
            .makePrepositional("with what")
            .withOnSuccess("hit it good")
            .withOnFailure("missed it")
            .build()
        )
        .build();

      bat = new Item.Builder("bat").isHoldable().build();
      moveItem(egg, selectInventory());
      moveItem(bat, selectInventory());
    });

    it("triggers effects, after actions, objects available in actions", async () => {
      addEffect("egg", "bat", "hit", true, false, ({ item, other }) => `${other!.name} smash ${item.name}`);
      await egg.try("hit", bat);
      expect(selectCurrentPage()).toInclude("bat smash egg");
      expect(selectCurrentPage()).not.toInclude("hit it good");
      expect(selectCurrentPage()).not.toInclude("missed it");
      expect(autoActionExecutor.checkAutoActions).toHaveBeenCalled();
    });

    it("optionally continues executing the verb after a successful effect", async () => {
      addEffect("egg", "bat", "hit", true, true, ({ item, other }) => `${other!.name} smash ${item.name}`);
      await egg.try("hit", bat);
      expect(selectCurrentPage()).toInclude("bat smash egg");
      expect(selectCurrentPage()).toInclude("hit it good");
    });

    it("optionally continues executing the verb after a failed effect", async () => {
      addEffect("egg", "bat", "hit", false, true, ({ item, other }) => `${other!.name} brush ${item.name}`);
      await egg.try("hit", bat);
      expect(selectCurrentPage()).toInclude("bat brush egg");
      expect(selectCurrentPage()).toInclude("missed it");
    });

    it("triggers wildcard effects, objects available in actions", async () => {
      addWildcardEffect("bat", "hit", true, false, ({ item, other }) => `${other!.name} smash ${item.name}`);
      await egg.try("hit", bat);
      expect(selectCurrentPage()).toInclude("bat smash egg");
      expect(selectCurrentPage()).not.toInclude("hit it good");
      expect(selectCurrentPage()).not.toInclude("missed it");
      expect(autoActionExecutor.checkAutoActions).toHaveBeenCalled();
    });

    it("optionally continues executing the verb after a successful wildcard effect", async () => {
      addWildcardEffect("bat", "hit", true, true, ({ item, other }) => `${other!.name} smash ${item.name}`);
      await egg.try("hit", bat);
      expect(selectCurrentPage()).toInclude("bat smash egg");
      expect(selectCurrentPage()).toInclude("hit it good");
    });

    it("optionally continues executing the verb after a failed wildcard effect", async () => {
      addWildcardEffect("bat", "hit", false, true, ({ item, other }) => `${other!.name} brush ${item.name}`);
      await egg.try("hit", bat);
      expect(selectCurrentPage()).toInclude("bat brush egg");
      expect(selectCurrentPage()).toInclude("missed it");
    });

    it("executes effects for normally non-prepositional verbs", async () => {
      const microscope = new Item.Builder("microscope").build();
      addEffect("egg", "microscope", "examine", true, false, "It looks interesting.");
      await egg.try("examine", microscope);
      expect(selectCurrentPage()).toInclude("It looks interesting.");
    });

    it("executes effects before the verb", async () => {
      // Check it's effect then verb, not verb then effect.
      let x = 60;
      addEffect("egg", "bat", "hit", true, true, () => (x /= 3));
      egg.verbs.hit.onSuccess.addAction(() => (x += 10));
      await egg.try("hit", bat);
      expect(x).toBe(30);
    });
  });
});
