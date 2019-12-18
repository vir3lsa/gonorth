import { CyclicText, RandomText } from "./text";

let cyclic, random;

beforeEach(() => {
  cyclic = new CyclicText("a", "b", "c");
  random = new RandomText("x", "y", "z");
});

test("Cyclic text gives texts in order", () => {
  expect(cyclic.next()).toBe("a");
  expect(cyclic.next()).toBe("b");
  expect(cyclic.next()).toBe("c");
  expect(cyclic.next()).toBe("a");
});

test("Cyclic text works with just one entry", () => {
  const text = new CyclicText("a");
  expect(text.next()).toBe("a");
  expect(text.next()).toBe("a");
  expect(text.next()).toBe("a");
});

test("Random text gives each entry but in a random order", () => {
  let values = [...random._texts];
  let val1 = random.next(),
    val2 = random.next(),
    val3 = random.next();
  values = values
    .filter(v => v !== val1)
    .filter(v => v !== val2)
    .filter(v => v !== val3); // Remove each random value from the list
  expect(val2).not.toBe(val1);
  expect(val3).not.toBe(val2);
  expect(values.length).toBe(0); // All values removed
});
