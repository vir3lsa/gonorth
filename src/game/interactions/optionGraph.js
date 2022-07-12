import { Action, ActionChain } from "../../utils/actionChain";
import { Option } from "./option";
import { goToRoom } from "../../utils/lifecycle";
import { getStore } from "../../redux/storeRegistry";
import { addOptionGraph } from "../../redux/gameActions";
import { selectInventoryItems } from "../../utils/selectors";

export const next = "OptionGraph_next";
export const previous = "OptionGraph_previous";

export class OptionGraph {
  constructor(id, ...nodes) {
    if (typeof id !== "string") {
      throw Error("OptionGraphs must be given unique ID strings.");
    }

    this.id = id;
    this.nodes = nodes.map((node) => ({ ...node })); // Shallow copy nodes
    this.startNode = nodes[0];
    this.flattened = {};
    this.allowRepeats = true;
    this.currentNode = null;
    this.promise = new Promise((resolve) => (this.resolve = resolve));

    this.reindex();
    getStore().dispatch(addOptionGraph(this));
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
          const skipNodeActions = value?.skipNodeActions;
          const exit = !value || value.exit || value.room;

          if (optionId && !optionNode) {
            throw Error(`Can't find node with id ${optionId}`);
          }

          if (value?.actions) {
            // The option is an object rather than a simple node reference.
            // Get any actions associated with the option.
            optionActions = Array.isArray(value.actions) ? [...value.actions] : [value.actions];
          } else if (value?.inventoryAction) {
            // We'll create a pseudo-node where we show the player's inventory items.
            const inventoryNodeId = `${node.id}-${choice}-inventory`;
            // Get a list of items in the inventory, filtering out any without names.
            const items = selectInventoryItems();
            if (items.length) {
              const inventoryOptions = items.reduce(
                (acc, item) => ({
                  ...acc,
                  [item.name]: {
                    node: node.id,
                    skipNodeActions: true,
                    // Perform the inventory action and don't render a 'Next' button.
                    actions: new Action(() => value.inventoryAction(item), false)
                  }
                }),
                {}
              );
              const inventoryNode = {
                id: inventoryNodeId,
                actions: "Use which item?",
                options: inventoryOptions
              };
              this.recordNodeIds(inventoryNode);

              // Ensure this option leads to the temporary node.
              optionId = inventoryNodeId;
              optionNode = inventoryNode;

              // Delete the temporary node after selecting one of its options.
              optionActions.push(() => this.deleteFlattenedNode(inventoryNodeId));
            } else {
              optionActions.push("You're not carrying anything.");
            }
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
          } else if (value?.room) {
            optionActions.push(() => goToRoom(value.room));
          } else if (optionId) {
            optionActions.push(() => this.activateNode(optionNode, !skipNodeActions));
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
      chain.propagateOptions = false; // Allow the graph to exit
      this.resolve();
    }

    return chain;
  }

  /*
   * Deletes a node from the flattened nodes object. Used when we've added a temporary node and would like to remove it.
   */
  deleteFlattenedNode(nodeId) {
    delete this.flattened[nodeId];
  }

  static get Builder() {
    return OptionGraphBuilder;
  }

  static get NodeBuilder() {
    return NodeBuilder;
  }
}

class OptionGraphBuilder {
  constructor(id) {
    this.id = id;
  }

  withNodes(...nodes) {
    const nodeObjs = nodes.map((node) => (node instanceof OptionGraphBuilder ? node.build() : node));
    this.nodes = nodeObjs;
    return this;
  }

  build() {
    return new OptionGraph(this.id, ...this.nodes);
  }
}

class NodeBuilder {
  constructor(id) {
    this.id = id;
  }

  withActions(...actions) {
    this.actions = actions;
    return this;
  }

  withOptions(options) {
    this.options = options;
    return this;
  }

  withOption(label, value) {
    if (!this.options) {
      this.options = {};
    }

    this.options[label] = value;
    return this;
  }

  noEndTurn(noEndTurn = true) {
    this.isNoEndTurn = noEndTurn;
    return this;
  }

  build() {
    return {
      id: this.id,
      actions: this.actions,
      options: this.options,
      noEndTurn: this.isNoEndTurn
    };
  }
}
