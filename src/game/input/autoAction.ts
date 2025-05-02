import { Option } from "../interactions/option";
import { Append } from "../interactions/interaction";
import { ActionChain } from "../../utils/actionChain";
import { Parser } from "./parser";
import { getStore } from "../../redux/storeRegistry";
import { AnyAction } from "redux";
import { changeInteraction } from "../../redux/gameActions";

export class AutoAction {
  condition;
  inputs;

  constructor(builder: AutoActionBuilder) {
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
      const success = await new Promise(async (resolve) => {
        let success = true;
        const actionChain = new ActionChain(() => new Parser(input(context)).parse());
        actionChain.options = new Option("Next", () => resolve(true), false);
        actionChain.propagateOptions = true;
        success = await actionChain.chain();

        if (!success) {
          // Set a new interaction to remove the Next button.
          getStore().dispatch(changeInteraction(new Append("")) as unknown as AnyAction);
          resolve(false);
        }
      });

      if (!success) {
        return false;
      }
    }

    return true;
  }

  static get Builder() {
    return AutoActionBuilder;
  }
}

export class AutoActionBuilder {
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
