import { Item } from "../../../../lib/gonorth";

export const STEP_INGREDIENTS = "ingredients";
export const STEP_HEAT = "heat";
export const STEP_STIR = "stir";
export const STEP_WATER = "water";
export const STEP_FAT = "fat";
export const STEP_BLOOD = "blood";

export class Alchemy {
  constructor() {
    this.procedures = [];
    this.candidates = [];
    this.waterLevel = 0;
    this.fatLevel = 0;
    this.bloodLevel = 0;
    this.temperature = 0;
    this.stirred = 0;
    this.potion = null;
    this.stepText = null;
  }

  addProcedures(...procedures) {
    procedures.forEach(procedure => {
      this.procedures.push(procedure);
      this.candidates.push(this.copyProcedure(procedure));
    });
  }

  flush() {
    this.waterLevel = 0;
    this.fatLevel = 0;
    this.bloodLevel = 0;
    this.potion = null;
    this.candidates = this.procedures.map(proc => this.copyProcedure(proc));
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

    if (this.candidates.length === 1) {
      // We know what potion we're making. Is it finished?
      const chosen = this.candidates[0];

      if (!chosen.procedure.steps.length) {
        // It's finished!
        this.potion = chosen.potion;
      }
    } else if (!this.candidates.length) {
      // No matching procedures - potion has failed
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

      return stepCopy;
    });
  }

  getLiquidText(liquid, level) {
    let readableLavel;

    if (level > 1) {
      readableLavel =
        "It overflows the rim and splashes onto the floor before finding its way to the drainage channel.";
    } else if (level === 1) {
      readableLavel = "It's full to the brim.";
    } else if (level === 0.75) {
      readableLavel = "It's now around three quarters full.";
    } else if (level === 0.5) {
      readableLavel = "It looks to be about half full.";
    } else if (level === 0.25) {
      readableLavel = "It's already a quarter full.";
    }

    let liquidText = `${liquid} gushes into the cauldron. ${readableLavel}`;

    return [liquidText, this.stepText];
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
