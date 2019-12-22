import {
  Alchemy,
  Procedure,
  STEP_INGREDIENTS,
  STEP_HEAT,
  STEP_WATER
} from "./alchemy";
import { Ingredient } from "./ingredient";

expect.extend({
  toInclude(received, value) {
    const pass = received.includes(value);
    return {
      message: () =>
        `expected '${received}' ${pass ? "not " : ""}to contain '${value}'`,
      pass
    };
  }
});

let alchemy;
const dryadToenails = new Ingredient("dryadToenails");
const alfalfa = new Ingredient("alfalfa");
const whiteSage = new Ingredient("whiteSage");
const proc = new Procedure({
  ordered: true,
  steps: [
    {
      ordered: false,
      steps: [
        { type: STEP_WATER, value: 0.5 },
        { type: STEP_INGREDIENTS, value: [dryadToenails, alfalfa, whiteSage] }
      ]
    },
    { type: STEP_HEAT, quantity: 3 }
  ]
});

beforeEach(() => {
  alchemy = new Alchemy();
  alchemy.addProcedure(proc);
});

test("it deep copies procedures", () => {
  expect(alchemy.candidates).toEqual(alchemy.procedures);
  expect(alchemy.candidates[0].procedure.steps[0].steps[1]).not.toBe(
    alchemy.procedures[0].procedure.steps[0].steps[1]
  );
});

test("it removes ingredient from candidate after it's added to cauldron", () => {
  alchemy.addIngredient(dryadToenails);
  expect(alchemy.candidates[0].procedure.steps[0].steps[1].value).not.toInclude(
    dryadToenails
  );
});

test("it removes ingredients step from group once all ingredients are added", () => {
  alchemy.addIngredient(dryadToenails);
  alchemy.addIngredient(alfalfa);
  alchemy.addIngredient(whiteSage);
  expect(alchemy.candidates[0].procedure.steps[0].steps.length).toBe(1);
});

test("it doesn't remove the water step when the correct level hasn't been reached", () => {
  alchemy.addWater();
  expect(alchemy.candidates[0].procedure.steps[0].steps.length).toBe(2);
});

test("it removes the water step when the correct level has been reached", () => {
  alchemy.addWater();
  alchemy.addWater();
  expect(alchemy.candidates[0].procedure.steps[0].steps.length).toBe(1);
});

test("it removes group once all steps are finished", () => {
  alchemy.addIngredient(dryadToenails);
  alchemy.addIngredient(alfalfa);
  alchemy.addIngredient(whiteSage);
  alchemy.addWater();
  alchemy.addWater();
  expect(alchemy.candidates[0].procedure.steps.length).toBe(1);
});

test("it allows unordered steps to be completed in any order", () => {
  alchemy.addWater();
  alchemy.addIngredient(whiteSage);
  alchemy.addIngredient(alfalfa);
  alchemy.addWater();
  alchemy.addIngredient(dryadToenails);
  expect(alchemy.candidates[0].procedure.steps.length).toBe(1);
});

test("it has a potion when the procedure is finished", () => {});
