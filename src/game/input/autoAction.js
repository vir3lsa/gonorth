import { Parser } from "./parser";

export class AutoAction {
  constructor(builder) {
    this.condition = builder.condition;
    this.inputs = builder.inputs;
  }

  check(context) {
    if (this.condition(context)) {
      return this.execute(context);
    }

    return Promise.resolve();
  }

  async execute(context) {
    for (const input of this.inputs) {
      await new Parser(input(context)).parse();
    }
  }

  static get Builder() {
    return Builder;
  }
}

class Builder {
  withCondition(condition) {
    if (typeof condition === "undefined") {
      this.condition = () => true;
    } else if (typeof condition === "boolean") {
      this.condition = () => condition;
    } else {
      this.condition = condition;
    }

    return this;
  }

  withInputs(...inputs) {
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
