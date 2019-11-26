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
