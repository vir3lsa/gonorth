import { ActionChain } from "./actionChain";
import { initStore } from "../redux/store";

initStore();

test("action chain ends early if action returns false", async () => {
  let x = 1;
  const chain = new ActionChain(
    () => {
      x++;
      return false;
    },
    () => (x *= 3)
  );
  await chain.chain();
  expect(x).toBe(2);
});
