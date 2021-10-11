import { CyclicText, PagedText, RandomText, SequentialText } from "./text";

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
    .filter((v) => v !== val1)
    .filter((v) => v !== val2)
    .filter((v) => v !== val3); // Remove each random value from the list
  expect(val2).not.toBe(val1);
  expect(val3).not.toBe(val2);
  expect(values.length).toBe(0); // All values removed
});

test("Cyclic text entries may be functions", () => {
  const text = new CyclicText(
    () => "a",
    "b",
    () => "c"
  );
  expect(text.next()).toBe("a");
  expect(text.next()).toBe("b");
  expect(text.next()).toBe("c");
});

test("Functions can take any number of arguments", () => {
  const text = new CyclicText(
    (x, y, z) => "result: " + (x + y + z),
    (x) => x
  );
  expect(text.next(1, 2, 3)).toBe("result: 6");
  expect(text.next("chips")).toBe("chips");
});

test("Sequential text entries may be functions", () => {
  const text = new SequentialText(
    () => "a",
    (x) => "" + x,
    (x, y, z) => "" + (x + y + z),
    "c"
  );
  expect(text.next(1, 2, 3)).toBe("a");
  expect(text.next(1, 2, 3)).toBe("1");
  expect(text.next(1, 2, 3)).toBe("6");
  expect(text.next(1, 2, 3)).toBe("c");
});

test("Paged text entries may be functions", () => {
  const text = new PagedText(
    () => "a",
    (x) => "" + x,
    (x, y, z) => "" + (x + y + z),
    "c"
  );
  expect(text.next(1, 2, 3)).toBe("a");
  expect(text.next(1, 2, 3)).toBe("1");
  expect(text.next(1, 2, 3)).toBe("6");
  expect(text.next(1, 2, 3)).toBe("c");
});

test("Random text entries may be functions", () => {
  const text = new RandomText(
    () => "a",
    (x) => "" + x,
    (x, y, z) => "" + (x + y + z),
    "c"
  );
  const results = [];
  results.push(text.next(1, 2, 3));
  results.push(text.next(1, 2, 3));
  results.push(text.next(1, 2, 3));
  results.push(text.next(1, 2, 3));
  expect(results).toContain("a");
  expect(results).toContain("1");
  expect(results).toContain("6");
  expect(results).toContain("c");
});
