import { Action, ActionChain } from "../../utils/actionChain";
import { Option } from "./option";

export const next = "OptionGraph_next";
export const previous = "OptionGraph_previous";

export class OptionGraph {
  constructor(...nodes) {
    this.nodes = nodes.map((node) => ({ ...node })); // Shallow copy nodes
    this.startNode = nodes[0];
    this.flattened = {};
    this.allowRepeats = true;
    this.currentNode = null;
    this.promise = new Promise((resolve) => (this.resolve = resolve));

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
    this.nodes.forEach((node, index, nodes) => {
      this.processOptions(node, index, nodes);
      this.recordNodeIds(node);
    });
  }

  processOptions(node, index, nodes) {
    if (node && node.options) {
      Object.entries(node.options).forEach(([label, value]) => {
        if (value === next) {
          node.options[label] = nodes[index + 1].id;
        } else if (value === previous) {
          node.options[label] = nodes[index - 1].id;
        }
      });
    }
  }

  recordNodeIds(node) {
    if (node && node.id) {
      if (this.flattened[node.id]) {
        // We've already got this one. Return to avoid infinite recursion
        return;
      }

      this.flattened[node.id] = node;
    }
  }

  addNodes(...nodes) {
    this.nodes.push(...nodes);
    nodes.forEach((node, index) => {
      this.processOptions(node, index, nodes);
      this.recordNodeIds(node);
    });
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

  activateNode(node, performNodeActions = true) {
    this.currentNode = node;
    node.visited = true;

    let { actions, options } = node;
    let optionObjects;

    actions = performNodeActions ? (Array.isArray(actions) ? actions : [actions]) : [""];

    if (typeof options === "function") {
      // If options is a function, evaluate it to get the options object.
      options = options();
    }

    if (options) {
      optionObjects = Object.entries(options)
        .map(([choice, value]) => {
          if (value && value.condition && !value.condition()) {
            // Condition not met for this option to appear.
            return undefined;
          }

          let optionId = typeof value === "string" ? value : value ? value.node : null;
          let optionNode = optionId && this.flattened[optionId];
          let optionActions = [];
          const exit = !value || value.exit;

          if (optionId && !optionNode) {
            throw Error(`Can't find node with id ${optionId}`);
          }

          if (value && value.actions) {
            // The option is an object rather than a simple node reference.
            // Get any actions associated with the option.
            optionActions = Array.isArray(value.actions) ? [...value.actions] : [value.actions];
          } else if (Array.isArray(value)) {
            optionActions = [...value];
          } else if (typeof value !== "string") {
            optionActions = [value];
          }

          if (!optionId && !exit) {
            // We're going to add another action - ensure the one before that doesn't create a next button.
            const lastAction = optionActions.pop();
            const nonNextLastAction = new Action(lastAction, false);
            optionActions.push(nonNextLastAction);

            // Return to the same node without repeating its actions.
            optionActions.push(() => this.activateNode(node, false));
          } else {
            optionActions.push(() => (optionId ? this.activateNode(optionNode) : null));
          }

          if (
            !optionId ||
            !optionNode.visited ||
            optionNode.allowRepeats ||
            (this.allowRepeats && optionNode.allowRepeats === undefined)
          ) {
            return new Option(choice, optionActions, !optionId || !optionNode.noEndTurn);
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
