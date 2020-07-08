import { ActionChain } from "./actionChain";
import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";
import { Option } from "../game/interactions/option";
import { Verb } from "../game/verbs/verb";

initStore();

test("action chain ends early if action fails", async () => {
  let x = 1;
  const chain = new ActionChain(
    helper => {
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
  const chain = new ActionChain(() => x++, () => x++);
  chain.insertActions(() => (x *= -1), () => (x *= 2));
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
