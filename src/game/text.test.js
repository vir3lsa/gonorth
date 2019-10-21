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

test("Random text gives each entry but in a random order", () => {
  let values = [...random._texts];
  let val1 = random.text,
    val2 = random.text,
    val3 = random.text;
  values = values
    .filter(v => v !== val1)
    .filter(v => v !== val2)
    .filter(v => v !== val3); // Remove each random value from the list
  expect(val2).not.toBe(val1);
  expect(val3).not.toBe(val2);
  expect(values.length).toBe(0); // All values removed
});
