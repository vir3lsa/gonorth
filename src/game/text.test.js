import { CyclicText, RandomText } from "./text";

let cyclic, random;

beforeEach(() => {
  cyclic = new CyclicText(["a", "b", "c"]);
  random = new RandomText(["x", "y", "z"]);
});

test("Cyclic text gives texts in order", () => {
  expect(cyclic.text).toBe("a");
  expect(cyclic.text).toBe("b");
  expect(cyclic.text).toBe("c");
  expect(cyclic.text).toBe("a");
});

test("Cyclic text works with just one entry", () => {
  const text = new CyclicText(["a"]);
  expect(text.text).toBe("a");
  expect(text.text).toBe("a");
  expect(text.text).toBe("a");
});

test("Random text gives a different result each time", () => {
  let val1 = random.text,
    val2 = random.text,
    val3 = random.text;
  expect(val2).not.toBe(val1);
  expect(val3).not.toBe(val2);
});
