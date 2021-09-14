import { ActionChain } from "./actionChain";
import { getStore } from "../redux/storeRegistry";
import { Option } from "../game/interactions/option";
import { Verb } from "../game/verbs/verb";
import { selectCurrentPage } from "./testSelectors";
import { newGame } from "../redux/gameActions";
import { initGame } from "../gonorth";

// Prevent console logging
getStore().dispatch(newGame(initGame("test", false), true, false));

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

test("No options are shown if requested", async () => {
  let x = 1;
  const chain = new ActionChain(() => x++);
  chain.options = new Option("one");
  chain.renderOptions = false;
  await chain.chain();
  expect(getStore().getState().game.interaction.options).toBeNull();
});

test("No options are shown if attempting verb", async () => {
  let x = 1;
  const doIt = new Verb("do it", true, () => x++);
  const chain = new ActionChain(() => doIt.attempt());
  chain.options = new Option("one");
  chain.renderOptions = false;
  await chain.chain();
  expect(getStore().getState().game.interaction.options).toBeNull();
});

test("Nested functions will be called until a value is returned", async () => {
  const chain = new ActionChain(() => () => () => () => (_, value) => `The value is ${value}`);
  await chain.chain(42);
  expect(selectCurrentPage()).toInclude("The value is 42");
});
