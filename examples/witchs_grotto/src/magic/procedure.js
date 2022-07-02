import { CyclicText } from "../../../../lib/gonorth";

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

  withSpirit(spirit) {
    this.step.spirit = spirit;
    return this;
  }

  withLeniency(leniency) {
    this.step.leniency = leniency;
    return this;
  }

  withText(...text) {
    this.step.text = text.length > 1 ? new CyclicText(...text) : text;
    return this;
  }

  withShortText(...text) {
    this.step.short = text.length > 1 ? new CyclicText(...text) : text;
    return this;
  }

  build() {
    return this.step;
  }
}
