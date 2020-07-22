const { englishList } = require("./textFunctions");

test("english list returns a single item", () => {
  expect(englishList(["earth"])).toEqual("earth");
});

test("english list returns two items with an and", () => {
  const list = ["earth", "wind"];
  expect(englishList(list)).toEqual("earth and wind");
});

test("english list returns three items with a comma and an and", () => {
  const list = ["earth", "wind", "fire"];
  expect(englishList(list)).toEqual("earth, wind and fire");
});

test("english list returns more items with commas", () => {
  const list = ["earth", "wind", "fire", "air"];
  expect(englishList(list)).toEqual("earth, wind, fire and air");
});
