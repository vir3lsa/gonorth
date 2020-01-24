import { ActionChain } from "../../utils/actionChain";
import { Option } from "./option";

export class OptionGraph {
  constructor(...nodes) {
    this.nodes = nodes;
    this.startNode = nodes[0];
    this.flattened = {};

    this.reindex();
  }

  reindex() {
    this.flattened = {};
    this.nodes.forEach(node => this.recordNodeIds(node));
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

  addNodes(...nodes) {
    this.nodes.push(...nodes);
    this.nodes.forEach(node => this.recordNodeIds(node));
  }

  getNode(id) {
    return this.flattened[id];
  }

  setStartNode(node) {
    if (typeof node === "string") {
      this.startNode = this.getNode(node);

      if (!this.startNode) {
        throw Error(`Can't find node with id ${node}`);
      }
    } else {
      this.startNode = node;
    }
  }

  commence() {
    return this.activateNode(this.startNode);
  }

  activateNode(node) {
    let { actions, options } = node;
    let optionObjects;

    actions = Array.isArray(actions) ? actions : [actions];

    if (options) {
      optionObjects = Object.entries(options).map(([choice, value]) => {
        let node = value;

        if (typeof node === "string") {
          // Treat as an ID reference
          node = this.flattened[node];

          if (!node) {
            throw Error(`Can't find node with id ${value}`);
          }
        }

        return new Option(
          choice,
          () => this.activateNode(node),
          !node.noEndTurn
        );
      });
    }

    const chain = new ActionChain(...actions);
    chain.options = optionObjects;

    if (!optionObjects) {
      chain.renderOptions = false; // Allow the graph to exit
    }

    return chain;
  }
}
