import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { Verb, newVerb } from "./verb";
import { changeInteraction, changeRoom } from "../../redux/gameActions";
import { Interaction } from "../interactions/interaction";
import { CyclicText, SequentialText, RandomText, PagedText, ConcatText } from "../interactions/text";
import { Option } from "../interactions/option";
import { selectCurrentPage, selectInteraction } from "../../utils/testSelectors";
import { addEffect, initGame, moveItem } from "../../gonorth";
import { clickNext, clickNextAndWait, deferAction } from "../../utils/testFunctions";
import { selectEffects, selectInventory, selectVerbNames } from "../../utils/selectors";
import { Item } from "../items/item";
import { Room } from "../items/room";
import { checkAutoActions } from "../input/autoActionExecutor";
import { ActionChain } from "../../utils/actionChain";
import { AnyAction } from "redux";
import { Effect, VerbRelation } from "../../utils/effects";

jest.mock("../input/autoActionExecutor", () => ({
  checkAutoActions: jest.fn(async () => true),
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
  verb.addAliases("twist", "twizzle");
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

it("can receive the alias that was used to invoke it", async () => {
  let result;
  const jump = new Verb.Builder("jump")
    .withAliases("hop")
    .withOnSuccess(({ alias }) => (result = alias as string))
    .build();
  await jump.attempt("someItem", "someOther", "hop");
  expect(result).toBe("hop");
});

it("can receive a partial context and args", async () => {
  const explain = new Verb.Builder("explain")
    .withExpectedArgs("tool", "prop")
    .withOnSuccess(({ tool, prop }) => `tool: ${tool}, prop: ${prop}`)
    .build();
  await explain.attemptWithContext({ tool: "pan" }, "pen knife");
  expect(selectCurrentPage()).toInclude("tool: pan, prop: pen knife");
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
      isKeyword: false,
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
    expect(verb.test instanceof ActionChain).toBe(true);
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
});

describe("smart tests", () => {
  let x: number, alpha: VerbT;

  beforeEach(() => {
    x = 0;
    alpha = new Verb.Builder("alpha")
      .withTest({ test: () => x < 10, onFailure: "fail" })
      .withOnSuccess("succeed")
      .build();
  });

  it("does not run onFailure if the verb succeeds", async () => {
    await alpha.attempt();
    expect(selectCurrentPage()).toBe("succeed");
  });

  it("runs onFailure if the verb does not succeed", async () => {
    x = 20;
    await alpha.attempt();
    expect(selectCurrentPage()).toBe("fail");
  });

  it("may be added one at a time", async () => {
    const beta = new Verb.Builder("beta")
      .withSmartTest(() => x < 1, "fail1")
      .withSmartTest(() => x < -1, "fail2")
      .withOnSuccess("success")
      .build();
    await beta.attempt();
    expect(selectCurrentPage()).toBe("fail2");
  });

  it("does not run additional tests after one fails", async () => {
    const gamma = new Verb.Builder("gamma")
      .withSmartTest(() => x > 1, "fail1")
      .withSmartTest(() => (x = 100) < 1, "fail2")
      .withOnSuccess("success")
      .build();
    await gamma.attempt();
    expect(selectCurrentPage()).toBe("fail1");
    expect(x).toBe(0); // Hasn't been set to 100.
  });

  it("allows additional smart tests to be added later", async () => {
    alpha.addTest(() => x < -1, "fail2");
    await alpha.attempt();
    expect(selectCurrentPage()).toBe("fail2");
  });

  it("allows additional smart tests to be inserted at the start of the chain", async () => {
    x = 20;
    alpha.insertTest(() => x < -1, "fail2");
    await alpha.attempt();
    expect(selectCurrentPage()).toBe("fail2");
  });

  it("can receive context in the test function", async () => {
    const delta = new Verb.Builder("delta")
      .withSmartTest(({ y }) => x < (y as number), "fail")
      .withOnSuccess("success")
      .withExpectedArgs("y")
      .build();
    await delta.attempt(0);
    expect(selectCurrentPage()).toBe("fail");
    await delta.attempt(5);
    expect(selectCurrentPage()).toInclude("success");
  });

  it("can receive context in the failure function", async () => {
    const epsilon = new Verb.Builder("epsilon")
      .withSmartTest(
        () => x > 1,
        ({ y }) => `fail-${y}`
      )
      .withOnSuccess("success")
      .withExpectedArgs("y")
      .build();
    await epsilon.attempt(10);
    expect(selectCurrentPage()).toBe("fail-10");
  });

  it("can use any chainable values for the failure function", async () => {
    const onFail = new ActionChain(({ y }) => `fail-${y}`, "apple", new ConcatText("b", "c"));
    onFail.renderNexts = false;
    const zeta = new Verb.Builder("zeta")
      .withSmartTest(() => x > 1, onFail)
      .withOnSuccess("success")
      .withExpectedArgs("y")
      .build();
    await zeta.attempt(10);
    expect(selectCurrentPage()).toBe("fail-10\n\napple\n\nb\n\nc");
  });

  it("can be passed any number of failure actions", async () => {
    let x = 0;
    const impossible = new Verb.Builder("impossible")
      .withSmartTest(
        false,
        () => x++,
        () => "done"
      )
      .build();
    await impossible.attempt();
    expect(x).toBe(1);
    expect(selectCurrentPage()).toContain("done");
  });

  it("can be passed failure actions as an array", async () => {
    let x = 0;
    const impossible = new Verb.Builder("impossible")
      .withSmartTest(false, [() => x++, () => x++, () => x++, () => "done"])
      .build();
    await impossible.attempt();
    expect(x).toBe(3);
    expect(selectCurrentPage()).toContain("done");
  });
});

describe("effects", () => {
  let egg: Item,
    bat: Item,
    verbSuccess = true;

  beforeEach(() => {
    unregisterStore();
    initGame("test", "", { debugMode: false });
    selectEffects().effects = {};

    egg = new Item.Builder("egg")
      .isHoldable()
      .withVerbs(
        new Verb.Builder("hit")
          .withSmartTest(() => verbSuccess, "verb not successful")
          .makePrepositional("with what")
          .withOnSuccess("hit it good")
          .withOnFailure("missed it")
      )
      .build();

    bat = new Item.Builder("bat").isHoldable().build();
    moveItem(egg, selectInventory());
    moveItem(bat, selectInventory());
  });

  it("triggers effects, after actions, objects available in actions", async () => {
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .isSuccessful(true)
        .withVerbRelation(VerbRelation.Instead)
        .withActions(({ item, other }) => `${other!.name} smash ${item.name}`)
    );
    await egg.try("hit", bat);
    expect(selectCurrentPage()).toInclude("bat smash egg");
    expect(selectCurrentPage()).not.toInclude("hit it good");
    expect(selectCurrentPage()).not.toInclude("missed it");
    expect(autoActionExecutor.checkAutoActions).toHaveBeenCalled();
  });

  it("optionally continues executing the verb after a successful effect", async () => {
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .isSuccessful(true)
        .withVerbRelation(VerbRelation.Before)
        .withActions(({ item, other }) => `${other!.name} smash ${item.name}`)
    );
    await egg.try("hit", bat);
    expect(selectCurrentPage()).toInclude("bat smash egg");
    expect(selectCurrentPage()).toInclude("hit it good");
  });

  it("optionally continues executing the verb after a failed effect", async () => {
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .isSuccessful(false)
        .withVerbRelation(VerbRelation.Before)
        .withActions(({ item, other }) => `${other!.name} brush ${item.name}`)
    );
    await egg.try("hit", bat);
    expect(selectCurrentPage()).toInclude("bat brush egg");
    expect(selectCurrentPage()).toInclude("missed it");
  });

  it("triggers wildcard effects, objects available in actions", async () => {
    addEffect(
      new Effect.Builder()
        .withAnyPrimaryItem()
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .isSuccessful(true)
        .withVerbRelation(VerbRelation.Instead)
        .withActions(({ item, other }) => `${other!.name} smash ${item.name}`)
    );
    await egg.try("hit", bat);
    expect(selectCurrentPage()).toInclude("bat smash egg");
    expect(selectCurrentPage()).not.toInclude("hit it good");
    expect(selectCurrentPage()).not.toInclude("missed it");
    expect(autoActionExecutor.checkAutoActions).toHaveBeenCalled();
  });

  it("optionally continues executing the verb after a successful wildcard effect", async () => {
    addEffect(
      new Effect.Builder()
        .withAnyPrimaryItem()
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .withVerbRelation(VerbRelation.Before)
        .withActions(({ item, other }) => `${other!.name} smash ${item.name}`)
    );
    await egg.try("hit", bat);
    expect(selectCurrentPage()).toInclude("bat smash egg");
    expect(selectCurrentPage()).toInclude("hit it good");
  });

  it("optionally continues executing the verb after a failed wildcard effect", async () => {
    addEffect(
      new Effect.Builder()
        .withAnyPrimaryItem()
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .isSuccessful(false)
        .withVerbRelation(VerbRelation.Before)
        .withActions(({ item, other }) => `${other!.name} brush ${item.name}`)
    );
    await egg.try("hit", bat);
    expect(selectCurrentPage()).toInclude("bat brush egg");
    expect(selectCurrentPage()).toInclude("missed it");
  });

  it("executes effects for normally non-prepositional verbs", async () => {
    const microscope = new Item.Builder("microscope").build();
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("microscope")
        .withVerbName("examine")
        .withVerbRelation(VerbRelation.Instead)
        .withActions("It looks interesting")
    );
    await egg.try("examine", microscope);
    expect(selectCurrentPage()).toInclude("It looks interesting");
  });

  it("executes effects before the verb", async () => {
    // Check it's effect then verb, not verb then effect.
    let x = 60;
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .withVerbRelation(VerbRelation.Before)
        .withActions(() => (x /= 3))
    );
    egg.verbs.hit.onSuccess.addAction(() => (x += 10));
    await egg.try("hit", bat);
    expect(x).toBe(30);
  });

  it("executes effects after the verb", async () => {
    // Check it's verb then effect, not effect then verb.
    let x = 60;
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .withVerbRelation(VerbRelation.After)
        .withActions(() => (x /= 2))
    );
    egg.verbs.hit.onSuccess.addAction(() => (x += 10));
    await egg.try("hit", bat);
    expect(x).toBe(35);
  });

  it("doesn't execute after the verb if the verb is unsuccessful", async () => {
    verbSuccess = false;
    let x = 60;
    addEffect(
      new Effect.Builder()
        .withPrimaryItem("egg")
        .withSecondaryItem("bat")
        .withVerbName("hit")
        .withVerbRelation(VerbRelation.After)
        .withActions(() => (x /= 2))
    );
    egg.verbs.hit.onSuccess.addAction(() => (x += 10));
    await egg.try("hit", bat);
    expect(x).toBe(60);
  });
});
