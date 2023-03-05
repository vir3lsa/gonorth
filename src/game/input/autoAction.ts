import { Parser } from "./parser";

export class AutoAction {
  condition;
  inputs;

  constructor(builder: Builder) {
    this.condition = builder.condition || (() => true);
    this.inputs = builder.inputs;
  }

  check(context: Context) {
    if (this.condition(context)) {
      return this.execute(context);
    }

    return Promise.resolve(true);
  }

  async execute(context: Context) {
    if (!this.inputs) {
      throw Error("AutoAction did not have any Inputs.");
    }

    for (const input of this.inputs) {
      const success = await new Parser(input(context)).parse();

      if (!success) {
        return false;
      }
    }

    return true;
  }

  static get Builder() {
    return Builder;
  }
}

class Builder {
  condition?: TestFunction;
  inputs?: Input[];

  withCondition(condition?: Test) {
    if (typeof condition === "undefined") {
      this.condition = () => true;
    } else if (typeof condition === "boolean") {
      this.condition = () => condition;
    } else {
      this.condition = condition;
    }

    return this;
  }

  withInputs(...inputs: (string | Input)[]) {
    this.inputs = inputs.map((input) => {
      if (typeof input === "function") {
        return input;
      } else {
        return () => input;
      }
    });
    return this;
  }

  build() {
    return new AutoAction(this);
  }
}
