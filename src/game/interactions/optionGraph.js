import { ActionChain } from "../../utils/actionChain";
import Option from "./option";

export class OptionGraph {
  constructor(graph) {
    this.graph = graph;
  }

  commence() {
    return this.activateNode(this.graph);
  }

  activateNode(node) {
    let { actions, options } = node;
    let optionObjects;

    actions = Array.isArray(actions) ? actions : [actions];

    if (options) {
      optionObjects = Object.entries(options).map(
        ([choice, node]) => new Option(choice, () => this.activateNode(node))
      );
    }

    const chain = new ActionChain(...actions);
    chain.options = optionObjects;

    if (!optionObjects) {
      chain.renderOptions = false; // Allow the graph to exit
    }

    return chain;
  }
}
