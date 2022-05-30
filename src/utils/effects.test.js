import { unregisterStore } from "../redux/storeRegistry";
import { initStore } from "../redux/store";
import { Item } from "../game/items/item";
import { Effects } from "./effects";
import { selectCurrentPage } from "./testSelectors";

let effects;

beforeEach(() => {
  unregisterStore();
  initStore();

  const paint = new Item("paint");
  effects = new Effects();
  effects.add(paint, new Item("canvas"), "apply", true, "A beautiful picture appears on the canvas.");
  effects.add(paint, new Item("face"), "apply", false, "It's the wrong kind of paint for face painting.");
  effects.addWildcard("pool", "put", true, ({ itemName }) => `The ${itemName} hits the water with a splash.`);
  effects.addWildcard("fire", "put", false, ({ itemName }) => `The ${itemName} doesn't seem to want to catch fire.`);
});

test("we can ask whether an item will have an effect on another item", () => {
  expect(effects.hasEffect("paint", "canvas", "apply")).toBe(true);
  expect(effects.hasEffect("paint", "floor", "apply")).toBe(false);
  expect(effects.hasEffect("paint", "canvas", "remove")).toBe(false);
});

test("we can ask whether an effect will be considered successful", () => {
  expect(effects.isSuccessful("paint", "canvas", "apply")).toBe(true);
  expect(effects.isSuccessful("paint", "face", "apply")).toBe(false);
  expect(effects.isSuccessful("paint", "canvas", "remove")).toBe(false);
});

test("non-registered effects are considered unsuccessful", () => {
  expect(effects.isSuccessful("paint", "door", "apply")).toBe(false);
  expect(effects.isSuccessful("mouse", "flower", "climb")).toBe(false);
});

test("effects are realised", async () => {
  await effects.apply("paint", "canvas", "apply").chain();
  expect(selectCurrentPage()).toInclude("beautiful picture");
});

test("effects are realised even when considered unsuccessful", async () => {
  await effects.apply("paint", "face", "apply").chain();
  expect(selectCurrentPage()).toInclude("wrong kind of paint");
});

test("effects can be added using item names", async () => {
  effects.add("cat", "dog", "pit", true, "The cat bests the dog");
  await effects.apply("cat", "dog", "pit").chain();
  expect(selectCurrentPage()).toInclude("The cat bests");
});

test("we can ask whether an item will have a wildcard effect on another item", () => {
  expect(effects.hasEffect("noodle", "pool", "put")).toBe(true);
  expect(effects.hasEffect("whale", "pool", "put")).toBe(true);
});

test("we can ask whether a wildcard effect will be considered successful", () => {
  expect(effects.isSuccessful("noodle", "pool", "put")).toBe(true);
  expect(effects.isSuccessful("bowl", "fire", "put")).toBe(false);
});

test("wildcard effects are realised", async () => {
  await effects.apply("noodle", "pool", "put").chain({ itemName: "noodle" });
  expect(selectCurrentPage()).toInclude("The noodle hits the water");
});

test("wildcard effects are realised even when considered unsuccessful", async () => {
  await effects.apply("bowl", "fire", "put").chain({ itemName: "bowl" });
  expect(selectCurrentPage()).toInclude("The bowl doesn't seem to want to catch fire");
});