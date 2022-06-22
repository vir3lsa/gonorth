import { Item, Text, RandomText, CyclicText, ConcatText, ManagedText, Verb, selectTurn } from "../../../../lib/gonorth";

export const STEP_INGREDIENTS = "ingredients";
export const STEP_HEAT = "heat";
export const STEP_STIR = "stir";
export const STEP_WATER = "water";
export const STEP_FAT = "fat";
export const STEP_BLOOD = "blood";
export const STEP_WORDS = "words";

export class Alchemy {
  constructor(spiritContainer) {
    this.spiritContainer = spiritContainer;
    this.procedures = [];
    this.flush();

    this.errors = new CyclicText(
      "The cauldron's contents become dull and grey. This doesn't seem right.",
      "The concoction in the pot turns a vile yellow and begins to smell of rotten eggs. Something's gone wrong.",
      "The potion acquires a thick oily skin and seems to have lost its potency. You've made a mistake somewhere."
    );
    this.errorShorts = new CyclicText(
      "dull and grey",
      "yellow and smells of rotten eggs, covered in a thick skin",
      "covered by a thick oily skin"
    );
    this.inert = new RandomText(
      "The mixture doesn't seem to be doing anything at all. It's no potion.",
      "The concoction seems totally inert. There's no magic to be seen.",
      "The contents sit dully in the pot. There's no evidence of anything happening."
    );
    this.randomIngredients = new RandomText(
      "Without a base to add it to, you're not sure what good it'll do.",
      "It drops into the empty cauldron inertly.",
      "Perhaps you ought to follow a recipe?"
    );
    this.extraIngredients = new RandomText(
      "Adding more and more ingredients is unlikely to help at this stage.",
      "Maybe you should call this one a failure and start again?",
      "The potion doesn't seem to be salvageable at this point."
    );
  }

  flush() {
    this.waterLevel = 0;
    this.fatLevel = 0;
    this.bloodLevel = 0;
    this.temperature = 0;
    this.stirred = 0;
    this.stepText = null;
    this.potion = null;
    this.makingPotion = false;
    this.shortDescription = null;
    this.lenientSteps = [];
    this.ingredientsAdded = false;
    this.errorMessageOnTurn = -1;
    this.candidates = this.procedures.map((proc) => this.copyProcedure(proc));
  }

  addProcedures(...procedures) {
    procedures.forEach((procedure) => {
      this.procedures.push(procedure);
      this.candidates.push(this.copyProcedure(procedure));
    });
  }

  addIngredient(ingredient) {
    this.ingredientsAdded = true;
    this.processStep(STEP_INGREDIENTS, ingredient);
    return this.stepText;
  }

  addWater() {
    this.waterLevel += 0.25;
    this.processStep(STEP_WATER);
    return this.getLiquidText("Water", this.waterLevel);
  }

  addFat() {
    this.fatLevel += 0.25;
    this.processStep(STEP_FAT);
    return this.getLiquidText("Animal fat", this.fatLevel);
  }

  addBlood() {
    this.bloodLevel += 0.25;
    this.processStep(STEP_BLOOD);
    return this.getLiquidText("Blood", this.bloodLevel);
  }

  addHeat() {
    this.temperature++;
    this.processStep(STEP_HEAT);
    return this.getHeatText();
  }

  stir() {
    this.stirred++;
    this.processStep(STEP_STIR);
    return this.stepText;
  }

  sayWords(word) {
    this.processStep(STEP_WORDS, word);
    return this.stepText;
  }

  processStep(stepType, ingredient) {
    this.stepText = null;

    const candidates = this.candidates.filter((cand) =>
      this.findMatchingStep(cand.procedure, stepType, ingredient, null)
    );

    if (candidates.length && this.liquidLevel && this.ingredientsAdded) {
      this.makingPotion = true;
    }

    if (candidates.length === 1) {
      // We know what potion we're making. Is it finished?
      const chosen = candidates[0];

      if (!chosen.procedure.steps.length) {
        // It's finished!
        this.potion = chosen.potion;
      }
    } else if (!candidates.length) {
      const turn = selectTurn();

      // No matching procedures - potion has failed
      if (this.makingPotion) {
        this.makingPotion = false;
        this.stepText = this.errors;
        this.shortDescription = this.errorShorts.next();
        this.lenientSteps = [];
        this.errorMessageOnTurn = turn;
      } else if (this.liquidLevel && this.ingredientsAdded && turn > this.errorMessageOnTurn) {
        this.stepText = this.inert.next();
        this.errorMessageOnTurn = turn;
      } else if (!this.liquidLevel && this.ingredientsAdded) {
        this.stepText = this.randomIngredients.next();
      } else if (turn > this.errorMessageOnTurn) {
        this.stepText = this.extraIngredients.next();
      }

      this.potion = null;
    }

    this.candidates = candidates;
  }

  findMatchingStep(group, stepType, ingredient) {
    const ordered = group.ordered;
    const steps = group.steps;
    const numStepsToConsider = steps.length && ordered ? 1 : steps.length;
    let stepToConsider, matchingStep, matchingGroup;

    if (group.spirit && !this.doesSpiritMatch(group.spirit)) {
      // Spirit must be correct or no steps can match
      return false;
    }

    for (let i = 0; i < numStepsToConsider; i++) {
      stepToConsider = steps[i];

      if (stepToConsider.hasOwnProperty("ordered")) {
        // recurse through the subgroup
        if (this.findMatchingStep(stepToConsider, stepType, ingredient)) {
          matchingGroup = stepToConsider;
          break;
        }
      } else if (stepToConsider.type === stepType) {
        switch (stepType) {
          case STEP_INGREDIENTS:
          case STEP_WORDS: {
            if (
              stepToConsider.value.some((value) => {
                const lcValue = value.toLowerCase();
                return (
                  lcValue === ingredient.name.toLowerCase() ||
                  (ingredient.aura && lcValue === ingredient.aura.toLowerCase())
                );
              })
            ) {
              matchingStep = stepToConsider;
            }
            break;
          }
          default:
            matchingStep = stepToConsider;
            break;
        }

        if (matchingStep) {
          // Matching step found so stop looking
          break;
        }
      }
    }

    if (!matchingStep && !matchingGroup) {
      // If we haven't found a matching step, try lenient steps.
      matchingStep = this.lenientSteps.find((lenientStep) => lenientStep.type === stepType);
    }

    if (matchingStep) {
      this.stepText = matchingStep.text; // Fine for this to be undefined
      this.shortDescription = matchingStep.short || this.shortDescription;

      if (this.shortDescription instanceof Text || this.shortDescription instanceof ManagedText) {
        this.shortDescription = this.shortDescription.next();
      }

      switch (stepType) {
        case STEP_INGREDIENTS:
        case STEP_WORDS:
          // Remove the matching ingredient from the step
          matchingStep.value = matchingStep.value.filter((item) => {
            const lcItem = item.toLowerCase();
            return lcItem !== ingredient.name.toLowerCase() && lcItem !== ingredient.aura.toLowerCase();
          });

          if (!matchingStep.value.length) {
            // Remove the empty step
            this.removeStep(steps, matchingStep);
          }

          break;
        case STEP_WATER:
          this.handleNumericStep(0.25, matchingStep, steps);
          break;
        case STEP_FAT:
          this.handleNumericStep(0.25, matchingStep, steps);
          break;
        case STEP_BLOOD:
          this.handleNumericStep(0.25, matchingStep, steps);
          break;
        case STEP_HEAT:
          this.handleNumericStep(1, matchingStep, steps);
          break;
        case STEP_STIR:
          this.handleNumericStep(1, matchingStep, steps);
          break;
        default:
          console.error(`alchemy: Unrecognised step type: ${stepType}`);
      }
    } else if (matchingGroup) {
      if (!matchingGroup.steps.length) {
        // Remove the empty group
        steps.splice(
          steps.findIndex((step) => step === matchingGroup),
          1
        );
      }
    }

    return matchingStep !== undefined || matchingGroup !== undefined;
  }

  removeStep(steps, matchingStep) {
    const stepIndex = steps.findIndex((step) => step === matchingStep);

    if (stepIndex > -1) {
      steps.splice(
        steps.findIndex((step) => step === matchingStep),
        1
      );
    }

    this.lenientSteps = this.lenientSteps.filter((step) => step !== matchingStep);

    // We could continue to match against this step if it's lenient.
    if (matchingStep.leniency) {
      // Copy the leniency over into the value so we can use it like a normal step.
      matchingStep.value[0] = matchingStep.leniency;
      matchingStep.leniency = 0;
      this.lenientSteps.push(matchingStep);
    }
  }

  handleNumericStep(amount, matchingStep, steps) {
    matchingStep.value[0] -= amount;

    if (matchingStep.value[0] === 0) {
      // Remove the completed step
      this.removeStep(steps, matchingStep);
    }
  }

  copyProcedure(proc) {
    return new Procedure(
      {
        ...proc.procedure,
        steps: this.copySteps(proc.procedure.steps)
      },
      proc.potion // No need to deep copy the potion
    );
  }

  copySteps(steps) {
    return steps.map((step) => {
      const stepCopy = { ...step };

      if (stepCopy.hasOwnProperty("ordered")) {
        // This step is a group
        stepCopy.steps = this.copySteps(step.steps);
      }

      // Clone Texts so their state is independent of the originals
      if (stepCopy.text && (stepCopy.text instanceof Text || stepCopy.text instanceof ManagedText)) {
        stepCopy.text = stepCopy.text.clone();
      }

      if (stepCopy.short && (stepCopy.short instanceof Text || stepCopy.short instanceof ManagedText)) {
        stepCopy.short = stepCopy.short.clone();
      }

      // Ensure that values are arrays
      if (stepCopy.value && !Array.isArray(stepCopy.value)) {
        stepCopy.value = [stepCopy.value];
      }

      return stepCopy;
    });
  }

  getLiquidText(liquid) {
    let readableLabel;

    if (this.liquidLevel > 1) {
      readableLabel =
        "It overflows the rim and splashes onto the floor before finding its way to the drainage channel.";
    } else if (this.liquidLevel === 1) {
      readableLabel = "It's full to the brim.";
    } else if (this.liquidLevel === 0.75) {
      readableLabel = "It's now around three quarters full.";
    } else if (this.liquidLevel === 0.5) {
      readableLabel = "It looks to be about half full.";
    } else if (this.liquidLevel === 0.25) {
      readableLabel = "It's already a quarter full.";
    }

    let liquidText = `${liquid} gushes into the cauldron. ${readableLabel}`;

    return new ConcatText(liquidText, this.stepText);
  }

  get liquidLevel() {
    return this.waterLevel + this.fatLevel + this.bloodLevel;
  }

  getHeatText() {
    if (this.stepText) {
      return this.stepText;
    }

    if (this.liquidLevel > 0) {
      if (this.temperature === 1) {
        return "The mixture is starting to warm through.";
      } else if (this.temperature === 3) {
        return "The pot is hot and you can feel the warmth coming off it when you lean over it.";
      } else if (this.temperature === 5) {
        return "The cauldron's contents are hot now. Steam is beginning to rise from the surface of the liquid.";
      } else if (this.temperature === 7) {
        return "Small bubbles are starting to rise to the surface of the brew.";
      } else if (this.temperature === 9) {
        return "The bubbles are getting larger and the liquid is agitated.";
      } else if (this.temperature === 10) {
        return "The concoction is properly boiling now, the surface roiling with large bubbles.";
      }
    } else {
      if (this.temperature === 3) {
        return "The cauldron is hot now.";
      }
    }

    return "The fire heats the cauldron.";
  }

  doesSpiritMatch(requiredSpirit) {
    const spirit = [...this.spiritContainer.uniqueItems].map((item) => item.spirit);

    if (spirit.length !== requiredSpirit.length) {
      return false;
    }

    // Find the first required spirit that's not in the actual spirit. If we find none then spirit is correct.
    const missingSpirit = requiredSpirit.find((required) => spirit.find((actual) => actual === required) === undefined);

    return !Boolean(missingSpirit);
  }
}

export class Procedure {
  constructor(procedure, potion) {
    this.procedure = procedure;
    this.potion = potion;
  }

  static get Builder() {
    return ProcedureBuilder;
  }

  static get StepBuilder() {
    return StepBuilder;
  }
}

class ProcedureBuilder {
  constructor() {
    this.procedure = { steps: [] };
  }

  isOrdered(ordered = true) {
    this.procedure.ordered = ordered;
    return this;
  }

  withSpirit(...spirit) {
    this.procedure.spirit = spirit;
    return this;
  }

  withPotion(potion) {
    this.potion = potion;
    return this;
  }

  withOrderedSteps(...steps) {
    this.procedure.steps.push({ ordered: true, steps });
    return this;
  }

  withUnorderedSteps(...steps) {
    this.procedure.steps.push({ ordered: false, steps });
    return this;
  }

  withStep(step) {
    this.procedure.steps.push(step);
    return this;
  }

  build() {
    return new Procedure(this.procedure, this.potion);
  }
}

class StepBuilder {
  constructor(type, ...value) {
    this.step = { type, value };
  }

  withLeniency(leniency) {
    this.step.leniency = leniency;
    return this;
  }

  withText(text) {
    this.step.text = text;
    return this;
  }

  withShortText(text) {
    this.step.short = text;
    return this;
  }

  build() {
    return this.step;
  }
}

export class Potion extends Item {
  clone() {
    const copy = new Potion(`${this.name} copy`, this.description, this.drinkable, [...this.drinkEffects]);
    copy.name = this.name; // Set the real name - okay for a clone because it won't be serialized.
    return copy;
  }

  constructor(name, description, drinkable = false, ...drinkEffects) {
    super(name, description, true, 1);
    this.drinkable = drinkable;
    this.drinkEffects = drinkEffects;

    const drink = new Verb(
      "drink",
      ({ item }) => item.drinkable,
      [({ item }) => item.container.removeItem(item), ...this.drinkEffects],
      ({ item }) =>
        `Other than leaving a foul taste in your mouth and the vague feeling of regret in your heart, there's no discernible effect from drinking the ${item.name}.`,
      ["swallow"]
    );

    const pour = new Verb(
      "pour",
      false,
      null,
      ({ item, other }) =>
        `You carefully pour a drop of the potion onto the ${other.name} but nothing happens. It doesn't appear to be affected by the ${item.name}.`,
      ["tip", "apply"]
    );
    pour.makePrepositional("on what");

    this.addVerbs(drink, pour);
    this.addAliases("potion");
  }

  static get Builder() {
    return PotionBuilder;
  }
}

class PotionBuilder {
  constructor(name) {
    this.name = name;
    this.drinkEffects = [];
  }

  withName(name) {
    this.name = name;
    return this;
  }

  withDescription(description) {
    this.description = description;
    return this;
  }

  isDrinkable(drinkable = true) {
    this.drinkable = drinkable;
    return this;
  }

  withDrinkEffects(...effects) {
    this.drinkEffects = effects;
    return this;
  }

  build() {
    return new Potion(this.name, this.description, this.drinkable, ...this.drinkEffects);
  }
}
