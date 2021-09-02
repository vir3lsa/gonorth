import { ActionChain } from "../../utils/actionChain";
import { Option } from "./option";

export class OptionGraph {
  constructor(...nodes) {
    this.nodes = nodes.map((node) => ({ ...node })); // Shallow copy nodes
    this.startNode = nodes[0];
    this.flattened = {};
    this.allowRepeats = true;
    this.promise = new Promise(resolve => this.resolve = resolve);

    this.reindex();
  }

  get allowRepeats() {
    return this._allowRepeats;
  }

  set allowRepeats(allowRepeats) {
    this._allowRepeats = allowRepeats;
  }

  reindex() {
    this.flattened = {};
    this.nodes.forEach((node) => this.recordNodeIds(node));
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
      Object.values(node.options).forEach((node) => this.recordNodeIds(node));
    }
  }

  addNodes(...nodes) {
    this.nodes.push(...nodes);
    this.nodes.forEach((node) => this.recordNodeIds(node));
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

  commence(id) {
    return this.activateNode(this.getNode(id) || this.startNode);
  }

  activateNode(node) {
    node.visited = true;

    let { actions, options } = node;
    let optionObjects;

    actions = Array.isArray(actions) ? actions : [actions];

    if (options) {
      optionObjects = Object.entries(options)
        .map(([choice, value]) => {
          let optionId = value;
          let optionNode;

          if (typeof optionId === "string") {
            // Treat as an ID reference
            optionNode = this.flattened[optionId];

            if (!optionNode) {
              throw Error(`Can't find node with id ${optionId}`);
            }
          } else {
            throw Error(
              "Option graph node options must refer to node IDs, not object references."
            );
          }

          if (
            !optionNode.visited ||
            optionNode.allowRepeats ||
            (this.allowRepeats && optionNode.allowRepeats === undefined)
          ) {
            return new Option(
              choice,
              () => this.activateNode(optionNode),
              !optionNode.noEndTurn
            );
          }

          // No option
          return undefined;
        })
        .filter((option) => option);
    }

    const chain = new ActionChain(...actions);
    chain.options = optionObjects;

    if (!optionObjects) {
      chain.renderOptions = false; // Allow the graph to exit
      this.resolve();
    }

    return chain;
  }
}
