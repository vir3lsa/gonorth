import {
  alchemy,
  Procedure,
  STEP_INGREDIENTS,
  STEP_HEAT,
  STEP_WATER,
  STEP_STIR,
  Potion
} from "./alchemy";
import { Ingredient } from "./ingredient";
import { CyclicText } from "../../../../src/gonorth";

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

const dryadToenails = new Ingredient("dryadToenails");
const alfalfa = new Ingredient("alfalfa");
const whiteSage = new Ingredient("whiteSage");
const cockroachSaliva = new Ingredient("cockroach saliva");
const horehound = new Ingredient("horehound");
const wormwood = new Ingredient("wormwood");
const mendingPotion = new Potion("Elixir of Mending", "Mends stuff");
const woodwormPotion = new Potion(
  "Organic Dissolution Accelerator",
  "Dissolves organics"
);
const anotherPotion = new Potion("Another", "");
const mendingProcedure = new Procedure(
  {
    ordered: true,
    steps: [
      {
        ordered: false,
        steps: [
          { type: STEP_WATER, value: 0.5 },
          {
            type: STEP_INGREDIENTS,
            value: [dryadToenails.name, alfalfa.name, whiteSage.name]
          }
        ]
      },
      { type: STEP_HEAT, value: 3, leniency: 3 }
    ]
  },
  mendingPotion
);
const woodwormProcedure = new Procedure(
  {
    ordered: true,
    steps: [
      { type: STEP_WATER, value: 1 },
      { type: STEP_INGREDIENTS, value: [cockroachSaliva.name, horehound.name] },
      {
        type: STEP_STIR,
        value: 3,
        text: new CyclicText(
          "The mixture turns brown.",
          "The mixture is thickening up.",
          "The mixture turns a deep red."
        )
      },
      { type: STEP_INGREDIENTS, value: [wormwood.name] }
    ]
  },
  woodwormPotion
);
const anotherProcedure = new Procedure(
  {
    ordered: true,
    steps: [
      { type: STEP_WATER, value: 0.25 },
      { type: STEP_INGREDIENTS, value: [horehound.name] },
      { type: STEP_STIR, value: 1, leniency: 1 },
      { type: STEP_INGREDIENTS, value: [wormwood.name] }
    ]
  },
  anotherPotion
);

alchemy.addProcedures(mendingProcedure, woodwormProcedure, anotherProcedure);

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

function stir(times) {
  for (let i = 0; i < times; i++) {
    alchemy.stir();
  }
}

function followMendingProcedure() {
  addIngredients(dryadToenails, alfalfa, whiteSage);
  addWater(2);
  addHeat(3);
}

beforeEach(() => {
  alchemy.flush();
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
    dryadToenails.name
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
  followMendingProcedure();
  expect(alchemy.potion).toBe(mendingPotion);
});

test("it has a different potion if another procedure is followed", () => {
  addWater(4);
  addIngredients(cockroachSaliva, horehound);
  stir(3);
  addIngredients(wormwood);
  expect(alchemy.potion).toBe(woodwormPotion);
});

test("no potion is produced if not enough heat is added", () => {
  addIngredients(dryadToenails, alfalfa, whiteSage);
  addWater(2);
  addHeat(2);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if too much water is added", () => {
  followMendingProcedure();
  addWater(1);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if an extra ingredient is added", () => {
  followMendingProcedure();
  addIngredients(horehound);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if an extra ingredient is added earlier on", () => {
  addIngredients(dryadToenails, alfalfa, whiteSage, horehound);
  addWater(2);
  addHeat(2);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if too much water is added earlier on", () => {
  addIngredients(dryadToenails, alfalfa, whiteSage);
  addWater(3);
  addHeat(2);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if the mixture is stirred too much", () => {
  addWater(4);
  addIngredients(cockroachSaliva, horehound);
  stir(4);
  addIngredients(wormwood);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if the mixture is not stirred enough", () => {
  addWater(4);
  addIngredients(cockroachSaliva, horehound);
  stir(2);
  addIngredients(wormwood);
  expect(alchemy.potion).toBe(null);
});

test("no potion is produced if the mixture is not stirred at the right time", () => {
  addWater(4);
  addIngredients(cockroachSaliva, horehound);
  stir(2);
  addIngredients(wormwood);
  stir(1);
  expect(alchemy.potion).toBe(null);
});

test("correct text is returned when potion steps are reached", () => {
  addWater(4);
  addIngredients(cockroachSaliva, horehound);
  const text = alchemy.stir();
  expect(text instanceof CyclicText).toBe(true);
  expect(text.next()).toBe("The mixture turns brown.");
});

test("is lenient with heat", () => {
  followMendingProcedure();
  addHeat(3);
  expect(alchemy.potion).toBe(mendingPotion);
});

test("isn't lenient forever", () => {
  followMendingProcedure();
  addHeat(4);
  expect(alchemy.potion).toBe(null);
});

test("follows steps after leniency", () => {
  addWater(1);
  addIngredients(horehound);
  stir(2);
  addIngredients(wormwood);
  expect(alchemy.potion).toBe(anotherPotion);
});
