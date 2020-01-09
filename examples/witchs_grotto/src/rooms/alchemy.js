import { Item, Text, RandomText, CyclicText } from "../../../../lib/gonorth";

export const STEP_INGREDIENTS = "ingredients";
export const STEP_HEAT = "heat";
export const STEP_STIR = "stir";
export const STEP_WATER = "water";
export const STEP_FAT = "fat";
export const STEP_BLOOD = "blood";

const errors = new CyclicText(
  "The cauldron's contents become dull and grey. This doesn't seem right.",
  "The concoction in the pot turns a vile yellow and begins to smell of rotten eggs. Something's gone wrong.",
  "The potion acquires a thick oily skin and seems to have lost its potency. You've made a mistake somewhere."
);
const errorShorts = new CyclicText(
  "dull and grey",
  "yellow and smells of rotten eggs, covered in a thick skin",
  "covered by a thick oily skin"
);
const inert = new RandomText(
  "The mixture doesn't seem to be doing anything at all. It's no potion.",
  "The concoction seems totally inert. There's no magic to be seen.",
  "The contents sit dully in the pot. There's no evidence of anything happening."
);

export class Alchemy {
  constructor() {
    this.procedures = [];
    this.flush();
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
    this.candidates = this.procedures.map(proc => this.copyProcedure(proc));
  }

  addProcedures(...procedures) {
    procedures.forEach(procedure => {
      this.procedures.push(procedure);
      this.candidates.push(this.copyProcedure(procedure));
    });
  }

  addIngredient(ingredient) {
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
    return this.stepText;
  }

  stir() {
    this.stirred++;
    this.processStep(STEP_STIR);
    return this.stepText;
  }

  processStep(stepType, ingredient) {
    this.candidates = this.candidates.filter(cand =>
      this.findMatchingStep(cand.procedure, stepType, ingredient)
    );

    if (this.candidates.length && this.liquidLevel) {
      this.makingPotion = true;
    }

    if (this.candidates.length === 1) {
      // We know what potion we're making. Is it finished?
      const chosen = this.candidates[0];

      if (!chosen.procedure.steps.length) {
        // It's finished!
        this.potion = chosen.potion;
      }
    } else if (!this.candidates.length) {
      // No matching procedures - potion has failed
      if (this.makingPotion) {
        this.makingPotion = false;
        this.stepText = errors;
        this.shortDescription = errorShorts.next();
      } else if (this.liquidLevel) {
        this.stepText = inert.next();
      } else {
        this.stepText = null;
      }

      this.potion = null;
    }
  }

  findMatchingStep(group, stepType, ingredient) {
    const ordered = group.ordered;
    const steps = group.steps;
    const numStepsToConsider = ordered ? 1 : steps.length;
    let stepToConsider, matchingStep, matchingGroup;

    if (!steps.length) {
      // No steps to match against - player has probably done too much
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
            if (stepToConsider.value.includes(ingredient)) {
              matchingStep = stepToConsider;
            }
            break;
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

    if (matchingStep) {
      this.stepText = matchingStep.text; // Fine for this to be undefined
      this.shortDescription = matchingStep.short || this.shortDescription;

      if (this.shortDescription instanceof Text) {
        this.shortDescription = this.shortDescription.next();
      }

      switch (stepType) {
        case STEP_INGREDIENTS:
          // Remove the matching ingredient from the step
          matchingStep.value = matchingStep.value.filter(
            item => item !== ingredient
          );

          if (!matchingStep.value.length) {
            // Remove the empty step
            this.removeStep(steps, matchingStep);
          }

          break;
        case STEP_WATER:
          this.handleNumericStep(this.waterLevel, matchingStep, steps);
          break;
        case STEP_FAT:
          this.handleNumericStep(this.fatLevel, matchingStep, steps);
          break;
        case STEP_BLOOD:
          this.handleNumericStep(this.bloodLevel, matchingStep, steps);
          break;
        case STEP_HEAT:
          this.handleNumericStep(this.temperature, matchingStep, steps);
          break;
        case STEP_STIR:
          this.handleNumericStep(this.stirred, matchingStep, steps);
          break;
      }
    } else if (matchingGroup) {
      if (!matchingGroup.steps.length) {
        // Remove the empty group
        steps.splice(
          steps.findIndex(step => step === matchingGroup),
          1
        );
      }
    }

    return matchingStep !== undefined || matchingGroup !== undefined;
  }

  removeStep(steps, matchingStep) {
    steps.splice(
      steps.findIndex(step => step === matchingStep),
      1
    );
  }

  handleNumericStep(measure, matchingStep, steps) {
    if (measure === matchingStep.value) {
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
    return steps.map(step => {
      const stepCopy = { ...step };

      if (stepCopy.hasOwnProperty("ordered")) {
        // This step is a group
        stepCopy.steps = this.copySteps(step.steps);
      }

      // Clone Texts so their state is independent of the originals
      if (stepCopy.text && stepCopy.text instanceof Text) {
        stepCopy.text = stepCopy.text.clone();
      }

      if (stepCopy.short && stepCopy.short instanceof Text) {
        stepCopy.short = stepCopy.short.clone();
      }

      return stepCopy;
    });
  }

  getLiquidText(liquid, level) {
    let readableLabel;

    if (level > 1) {
      readableLabel =
        "It overflows the rim and splashes onto the floor before finding its way to the drainage channel.";
    } else if (level === 1) {
      readableLabel = "It's full to the brim.";
    } else if (level === 0.75) {
      readableLabel = "It's now around three quarters full.";
    } else if (level === 0.5) {
      readableLabel = "It looks to be about half full.";
    } else if (level === 0.25) {
      readableLabel = "It's already a quarter full.";
    }

    let liquidText = `${liquid} gushes into the cauldron. ${readableLabel}`;

    return [liquidText, this.stepText];
  }

  get liquidLevel() {
    return this.waterLevel + this.fatLevel + this.bloodLevel;
  }
}

export class Procedure {
  constructor(procedure, potion) {
    this.procedure = procedure;
    this.potion = potion;
  }
}

export class Potion extends Item {
  constructor(name, description) {
    super(name, description, true, 1);
    // Add drink verb etc
  }
}
