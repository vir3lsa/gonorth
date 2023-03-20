import { englishList, getBasicItemList, bulletPointList } from "./textFunctions";
import { newItem } from "../game/items/item";
import { initStore } from "../redux/store";

initStore("test");

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

describe("getBasicItemList", () => {
  const items = [
    newItem({ name: "elephant", article: "an" }),
    newItem({ name: "screw", article: "a" }),
    newItem({ name: "porcupine", article: "a" })
  ];

  test("returns a list of items with correct articles", () =>
    expect(getBasicItemList(items)).toEqual("an elephant, a screw, and a porcupine"));

  test("doesn't include an Oxford comma when there are only two items", () =>
    expect(getBasicItemList(items.slice(1))).toEqual("a screw and a porcupine"));

  test("returns a list of items with definite articles", () =>
    expect(getBasicItemList(items, true)).toEqual("the elephant, the screw, and the porcupine"));

  test("returns a bulleted list of items with correct articles", () => {
    const result = bulletPointList(items);
    expect(result).toInclude("an elephant");
    expect(result).toInclude("a screw");
    expect(result).toInclude("a porcupine");
  });

  test("returns a bulleted list of items with definite articles", () => {
    const result = bulletPointList(items, true);
    expect(result).toInclude("the elephant");
    expect(result).toInclude("the screw");
    expect(result).toInclude("the porcupine");
  });
});
