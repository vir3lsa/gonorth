import { Item } from "../../../../lib/gonorth";

export const STEP_INGREDIENTS = "ingredients";
export const STEP_HEAT = "heat";
export const STEP_STIR = "stir";
export const STEP_COOL = "cool";
export const STEP_WATER = "water";
export const STEP_OIL = "oil";
export const STEP_BLOOD = "blood";

export class Alchemy {
  constructor() {
    this.procedures = [];
    this.candidates = [];
    this.waterLevel = 0;
    this.oilLevel = 0;
    this.bloodLevel = 0;
    this.potion = null;
  }

  addProcedure(procedure) {
    this.procedures.push(procedure);
    this.candidates.push(this.copyProcedure(procedure));
  }

  flush() {
    this.waterLevel = 0;
    this.oilLevel = 0;
    this.bloodLevel = 0;
    this.potion = null;
    this.candidates = this.procedures.map(proc => this.copyProcedure(proc));
  }

  addIngredient(ingredient) {
    this.candidates = this.candidates.filter(cand =>
      this.findMatchingStep(cand.procedure, STEP_INGREDIENTS, ingredient)
    );

    this.checkPotion();
  }

  addWater() {
    this.waterLevel += 0.25;
    this.candidates = this.candidates.filter(cand =>
      this.findMatchingStep(cand.procedure, STEP_WATER)
    );

    this.checkPotion();
  }

  addOil() {
    this.oilLevel += 0.25;
    this.candidates = this.candidates.filter(cand =>
      this.findMatchingStep(cand.procedure, STEP_OIL)
    );

    this.checkPotion();
  }

  addBlood() {
    this.bloodLevel += 0.25;
    this.candidates = this.candidates.filter(cand =>
      this.findMatchingStep(cand.procedure, STEP_BLOOD)
    );

    this.checkPotion();
  }

  checkPotion() {
    if (this.candidates.length === 1) {
      // We know what potion we're making. Is it finished?
      const chosen = this.candidates[0];

      if (!chosen.procedure.steps.length) {
        // It's finished!
        this.potion = chosen.potion;
      }
    }
  }

  findMatchingStep(group, stepType, ingredient) {
    const ordered = group.ordered;
    const steps = group.steps;
    const numStepsToConsider = ordered ? 1 : steps.length;
    let stepToConsider, matchingStep, matchingGroup;

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
          case STEP_WATER:
          case STEP_OIL:
          case STEP_BLOOD:
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
      // Function to remove a completed step
      const removeStep = (steps, matchingStep) => {
        steps.splice(
          steps.findIndex(step => step === matchingStep),
          1
        );
      };

      switch (stepType) {
        case STEP_INGREDIENTS:
          // Remove the matching ingredient from the step
          matchingStep.value = matchingStep.value.filter(
            item => item !== ingredient
          );

          if (!matchingStep.value.length) {
            // Remove the empty step
            removeStep(steps, matchingStep);
          }

          break;
        case STEP_WATER:
          if (this.waterLevel === matchingStep.value) {
            // Remove the completed step
            removeStep(steps, matchingStep);
          }
          break;
        case STEP_OIL:
          if (this.oilLevel === matchingStep.value) {
            // Remove the completed step
            removeStep(steps, matchingStep);
          }
          break;
        case STEP_BLOOD:
          if (this.bloodLevel === matchingStep.value) {
            // Remove the completed step
            removeStep(steps, matchingStep);
          }
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

  copyProcedure(proc) {
    return new Procedure({
      ...proc.procedure,
      steps: this.copySteps(proc.procedure.steps)
    });
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
