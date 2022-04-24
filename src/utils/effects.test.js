import { unregisterStore } from "../redux/storeRegistry";
import { initStore } from "../redux/store";
import { Item } from "../game/items/item";
import { Effects, FixedSubjectEffects } from "./effects";
import { selectCurrentPage } from "./testSelectors";

let effects, subjectEffects;

beforeEach(() => {
  unregisterStore();
  initStore();

  const paint = new Item("paint");
  effects = new Effects((primary, secondary) => `The ${primary.name} doesn't do anything to the ${secondary.name}.`);
  effects.add(paint, new Item("canvas"), true, "A beautiful picture appears on the canvas.");
  effects.add(paint, new Item("face"), false, "It's the wrong kind of paint for face painting.");

  subjectEffects = new FixedSubjectEffects(
    new Item("car"),
    (primary) => `The ${primary.name} doesn't do anything to the car.`
  );
  subjectEffects.add(new Item("driver"), true, "The driver drives the car");
  subjectEffects.add(new Item("toddler"), false, "The toddler's out of its depth.");
});

test("we can ask whether an item will have an effect on another item", () => {
  expect(effects.hasEffect("paint", "canvas")).toBe(true);
  expect(effects.hasEffect("paint", "floor")).toBe(false);
});

test("we can ask whether an effect will be considered successful", () => {
  expect(effects.isSuccessful("paint", "canvas")).toBe(true);
  expect(effects.isSuccessful("paint", "face")).toBe(false);
});

test("non-registered effects are considered unsuccessful", () => {
  expect(effects.isSuccessful("paint", "door")).toBe(false);
  expect(effects.isSuccessful("mouse", "flower")).toBe(false);
});

test("effects are realised", async () => {
  await effects.apply("paint", "canvas").chain();
  expect(selectCurrentPage()).toInclude("beautiful picture");
});

test("effects are realised even when considered unsuccessful", async () => {
  await effects.apply("paint", "face").chain();
  expect(selectCurrentPage()).toInclude("wrong kind of paint");
});

test("we can ask whether an item will have an effect on the subject", () => {
  expect(subjectEffects.hasEffect("driver")).toBe(true);
  expect(subjectEffects.hasEffect("dancer")).toBe(false);
});

test("we can ask whether an effect on a subject will be considered successful", () => {
  expect(subjectEffects.isSuccessful("driver")).toBe(true);
  expect(subjectEffects.isSuccessful("toddler")).toBe(false);
});

test("non-registered effects on subjects are considered unsuccessful", () => {
  expect(subjectEffects.isSuccessful("dancer")).toBe(false);
});

test("effects on subjects are realised", async () => {
  await subjectEffects.apply("driver").chain();
  expect(selectCurrentPage()).toInclude("drives the car");
});

test("effects on subjects are realised even when considered unsuccessful", async () => {
  await subjectEffects.apply("toddler").chain();
  expect(selectCurrentPage()).toInclude("out of its depth");
});

test("effects can be added using item names", async () => {
  effects.add("cat", "dog", true, "The cat bests the dog");
  await effects.apply("cat", "dog").chain();
  expect(selectCurrentPage()).toInclude("The cat bests");
});
