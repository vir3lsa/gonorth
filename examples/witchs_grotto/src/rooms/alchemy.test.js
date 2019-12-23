import {
  Alchemy,
  Procedure,
  STEP_INGREDIENTS,
  STEP_HEAT,
  STEP_WATER,
  Potion
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
const potion = new Potion("Elixir of Mending", "Mends stuff");
const proc = new Procedure(
  {
    ordered: true,
    steps: [
      {
        ordered: false,
        steps: [
          { type: STEP_WATER, value: 0.5 },
          { type: STEP_INGREDIENTS, value: [dryadToenails, alfalfa, whiteSage] }
        ]
      },
      { type: STEP_HEAT, value: 3 }
    ]
  },
  potion
);

function addIngredients(...ingredients) {
  ingredients.forEach(ingredient => alchemy.addIngredient(ingredient));
}

function addWater(times) {
  for (let i = 0; i < times; i++) {
    alchemy.addWater();
  }
}

function addHeat(times) {
  for (let i = 0; i < times; i++) {
    alchemy.addHeat();
  }
}

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
  addIngredients(dryadToenails, alfalfa, whiteSage);
  expect(alchemy.candidates[0].procedure.steps[0].steps.length).toBe(1);
});

test("it doesn't remove the water step when the correct level hasn't been reached", () => {
  alchemy.addWater();
  expect(alchemy.candidates[0].procedure.steps[0].steps.length).toBe(2);
});

test("it removes the water step when the correct level has been reached", () => {
  addWater(2);
  expect(alchemy.candidates[0].procedure.steps[0].steps.length).toBe(1);
});

test("it removes group once all steps are finished", () => {
  addIngredients(dryadToenails, alfalfa, whiteSage);
  addWater(2);
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

test("it has a potion when the procedure is finished", () => {
  addIngredients(dryadToenails, alfalfa, whiteSage);
  addWater(2);
  addHeat(3);
  expect(alchemy.potion).toBe(potion);
});
