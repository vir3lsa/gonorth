import { ActionChain } from "./actionChain";
import { initStore } from "../redux/store";

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
