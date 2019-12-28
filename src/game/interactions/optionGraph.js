import { ActionChain } from "../../utils/actionChain";
import { Option } from "./option";

export class OptionGraph {
  constructor(graph) {
    this.graph = graph;
    this.flattened = {};

    this.reindex();
  }

  reindex() {
    this.flattened = {};
    this.recordNodeIds(this.graph);
  }

  recordNodeIds(node) {
    if (node && node.id) {
      if (this.flattened[node.id]) {
        // We've already got this one. Return to avoid infinite recursion
        return;
      }

      this.flattened[node.id] = node;
    }

    if (node && node.options) {
      Object.values(node.options).forEach(node => this.recordNodeIds(node));
    }
  }

  getNode(id) {
    return this.flattened[id];
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
