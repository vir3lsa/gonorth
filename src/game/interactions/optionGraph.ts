import { ActionClass, ActionChain } from "../../utils/actionChain";
import { Option } from "./option";
import { goToRoom } from "../../utils/lifecycle";
import { getStore } from "../../redux/storeRegistry";
import { addOptionGraph, changeImage } from "../../redux/gameActions";
import {
  selectInventoryItems,
  selectRecordChanges,
  selectRoom,
} from "../../utils/selectors";

export const next = "OptionGraph_next";
export const previous = "OptionGraph_previous";
export const okay = "OpyionGraph_okay";

export class OptionGraph {
  id;
  nodes;
  startNode;
  flattened: { [id: string]: GraphNode };
  currentNode?: GraphNode;
  promise;
  resolve!: Resolve;
  persist: boolean;
  running = false;
  _allowRepeats!: boolean;
  _image?: string;
  _resumable!: boolean;

  constructor(id: string, ...nodes: GraphNode[]) {
    if (typeof id !== "string") {
      throw Error("OptionGraphs must be given unique ID strings.");
    }

    this.id = id;
    this.nodes = nodes.map((node) => ({ ...node })); // Shallow copy nodes
    this.startNode = nodes[0];
    this.flattened = {};
    this.allowRepeats = true;
    this.currentNode = undefined;
    this.resumable = true;
    this.promise = new Promise((resolve) => (this.resolve = resolve));

    // Don't persist OptionGraphs created after the game starts.
    this.persist = !selectRecordChanges();

    this.reindex();
    getStore().dispatch(addOptionGraph(this));
  }

  get allowRepeats() {
    return this._allowRepeats;
  }

  set allowRepeats(allowRepeats) {
    this._allowRepeats = allowRepeats;
  }

  get image() {
    return this._image;
  }

  set image(value) {
    this._image = value;
  }

  get resumable() {
    return this._resumable;
  }

  set resumable(value) {
    this._resumable = value;
  }

  reindex() {
    this.flattened = {};
    this.nodes.forEach((node, index, nodes) => {
      this.processOptions(node, index, nodes);
      this.recordNodeIds(node);
    });
  }

  processOptions(node: GraphNode, index: number, nodes: GraphNode[]) {
    if (node && node.options && typeof node.options !== "function") {
      const options = node.options as GraphOptions;
      Object.entries(options).forEach(([label, value]) => {
        if (value === next) {
          options[label] = nodes[index + 1].id;
        } else if (value === previous) {
          options[label] = nodes[index - 1].id;
        } else if (value === okay) {
          options[label] = null;
        }
      });
    }
  }

  recordNodeIds(node: GraphNode) {
    if (node && node.id) {
      if (this.flattened[node.id]) {
        // We've already got this one. Return to avoid infinite recursion
        return;
      }

      this.flattened[node.id] = node;
    }
  }

  addNodes(...nodes: GraphNode[]) {
    this.nodes.push(...nodes);
    nodes.forEach((node, index) => {
      this.processOptions(node, index, nodes);
      this.recordNodeIds(node);
    });
  }

  getNode(id: string) {
    return this.flattened[id];
  }

  setStartNode(node: GraphNode | string) {
    if (typeof node === "string") {
      this.startNode = this.getNode(node);

      if (!this.startNode) {
        throw Error(`Can't find node with id ${node}`);
      }
    } else {
      this.startNode = node;
    }
  }

  commence(id?: string) {
    if (this.image) {
      getStore().dispatch(changeImage(this.image));
    }
    return this._start((id && this.getNode(id)) || this.startNode);
  }

  resume() {
    if (this.resumable) {
      return this._start(this.currentNode || this.startNode);
    }

    throw Error(`Attempted to resume non-resumable OptionGraph '${this.id}'.`);
  }

  _start(node: GraphNode) {
    if (this.image) {
      getStore().dispatch(changeImage(this.image));
    }

    this.running = true;
    return this.activateNode(node);
  }

  _recordCurrentNode(node: GraphNode) {
    if (this.resumable) {
      this.currentNode = node;
    }
  }

  activateNode(node: GraphNode, performNodeActions = true) {
    this._recordCurrentNode(node);
    node.visited = true;

    let { actions, options } = node;
    let optionObjects: Option[] | undefined = undefined;
    let graphOptions;

    actions = performNodeActions ? (Array.isArray(actions) ? actions : [actions]) : [""];

    if (typeof options === "function") {
      // If options is a function, evaluate it to get the options object.
      graphOptions = options();
    } else {
      graphOptions = options;
    }

    if (graphOptions) {
      optionObjects = Object.entries(graphOptions)
        .map(([choice, value]) => {
          const graphOption = value as GraphOption;
          if (graphOption && graphOption.condition && !graphOption.condition()) {
            // Condition not met for this option to appear.
            return undefined;
          }

          let optionId: string | undefined =
            typeof value === "string" ? value : graphOption ? graphOption.node : undefined;
          let optionNode = (optionId && this.flattened[optionId]) as GraphNode | undefined;
          let optionActions: Action[] = [];
          const skipNodeActions = graphOption?.skipNodeActions;
          const exit = !value || graphOption.exit || graphOption.room;

          if (optionId && !optionNode) {
            throw Error(`Can't find node with id ${optionId}`);
          }

          if (graphOption?.actions) {
            // The option is an object rather than a simple node reference.
            // Get any actions associated with the option.
            optionActions = Array.isArray(graphOption.actions) ? [...graphOption.actions] : [graphOption.actions];
          } else if (graphOption?.inventoryAction) {
            // We'll create a pseudo-node where we show the player's inventory items.
            const inventoryNodeId: string = `${node.id}-${choice}-inventory`;
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
                    actions: new ActionClass(() => graphOption.inventoryAction?.(item), false)
                  }
                }),
                {}
              );
              const inventoryNode = {
                id: inventoryNodeId,
                actions: "Use which item?",
                options: inventoryOptions,
                visited: false
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
            optionActions = [value as Action];
          }

          if (!optionId && !exit) {
            // We're going to add another action - ensure the one before that doesn't create a next button.
            const lastAction = optionActions.pop();
            const nonNextLastAction = new ActionClass(lastAction, false);
            optionActions.push(nonNextLastAction);

            // Return to the same node without repeating its actions.
            optionActions.push(() => this.activateNode(node, false));
          } else if (graphOption?.room) {
            optionActions.unshift(() => this.handleExit());
            optionActions.push(() => goToRoom(graphOption.room as RoomT));
          } else if (optionId) {
            optionActions.push(() => this.activateNode(optionNode as GraphNode, !skipNodeActions));
          } else if (exit) {
            optionActions.unshift(() => this.handleExit());
          }

          if (
            !optionId ||
            !optionNode?.visited ||
            optionNode.allowRepeats ||
            (this.allowRepeats && optionNode.allowRepeats === undefined)
          ) {
            return new Option(choice, optionActions, !optionId || !optionNode?.noEndTurn);
          }

          // No option
          return undefined;
        })
        .filter((option) => option) as Option[];
    }

    const chain = new ActionChain(...actions);
    chain.options = optionObjects;

    if (!optionObjects) {
      chain.propagateOptions = false; // Allow the graph to exit
      this.handleExit();
    }

    return chain;
  }

  private handleExit() {
    this.resolve();
    this.running = false;
    const room = selectRoom();

    // Return to room image if we're in a room.
    getStore().dispatch(changeImage(room?.image));
  }

  /*
   * Deletes a node from the flattened nodes object. Used when we've added a temporary node and would like to remove it.
   */
  deleteFlattenedNode(nodeId: string) {
    delete this.flattened[nodeId];
  }

  isRunning() {
    return this.running;
  }

  static get Builder() {
    return OptionGraphBuilder;
  }

  static get NodeBuilder() {
    return NodeBuilder;
  }

  static get OptionBuilder() {
    return OptionBuilder;
  }
}

class OptionGraphBuilder {
  private id;
  private image?: string;
  private resumable = true;
  private nodes: GraphNode[] = [];

  constructor(id: string) {
    this.id = id;
  }

  withImage(image?: string) {
    this.image = image;
    return this;
  }

  isResumable(resumable = true) {
    this.resumable = resumable;
    return this;
  }

  withNodes(...nodes: (NodeBuilder | GraphNode)[]) {
    nodes.forEach((node) => this.withNode(node));
    return this;
  }

  withNode(node: NodeBuilder | GraphNode) {
    const nodeObj = node instanceof NodeBuilder ? node.build() : node;
    this.nodes.push(nodeObj);
    return this;
  }

  build() {
    const optionGraph = new OptionGraph(this.id, ...this.nodes);
    optionGraph.image = this.image;
    optionGraph.resumable = this.resumable;

    return optionGraph;
  }
}

class NodeBuilder {
  private id;
  private actions: Action[] = [];
  private options?: GraphOptions;
  private isNoEndTurn?: boolean;

  constructor(id: string) {
    this.id = id;
  }

  withActions(...actions: Action[]) {
    this.actions = actions;
    return this;
  }

  withOptions(options: GraphOptions) {
    this.options = options;
    return this;
  }

  withOption(
    labelOrValue: string | GraphOption | OptionBuilder,
    value?: SomeGraphOption | OptionBuilder
  ) {
    if (!this.options) {
      this.options = {};
    }

    let graphOption;
    if (value instanceof OptionBuilder) {
      graphOption = value.build();
    } else {
      graphOption = value;
    }

    if (typeof labelOrValue === "string") {
      this.options[labelOrValue] = graphOption;
    } else {
      graphOption =
        labelOrValue instanceof OptionBuilder
          ? labelOrValue.build()
          : labelOrValue;
      let id = graphOption.id;

      if (!id) {
        throw Error("Tried to create an OptionGraph Option without an ID.");
      }

      this.options[id] = graphOption;
    }

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
      noEndTurn: this.isNoEndTurn,
      visited: false,
      allowRepeats: true
    } as GraphNode;
  }
}

class OptionBuilder {
  private id?: string;
  private condition?: Condition;
  private node?: string;
  private skipNodeActionsBool?: boolean;
  private exitBool?: boolean;
  private room?: RoomT;
  private action?: Action;
  private inventoryAction?: InventoryAction;

  constructor(id?: string) {
    this.id = id;
  }

  withId(id: string) {
    this.id = id;
    return this;
  }

  withCondition(condition: Condition) {
    this.condition = condition;
    return this;
  }

  withNode(node: string) {
    this.node = node;
    return this;
  }

  skipNodeActions(skip = true) {
    this.skipNodeActionsBool = skip;
    return this;
  }

  exit(exit = true) {
    this.exitBool = exit;
    return this;
  }

  withRoom(room: RoomT) {
    this.room = room;
    return this;
  }

  withAction(action: Action) {
    this.action = action;
    return this;
  }

  withInventoryAction(action: InventoryAction) {
    this.inventoryAction = action;
    return this;
  }

  build(): GraphOption {
    return {
      id: this.id,
      condition: this.condition,
      node: this.node,
      skipNodeActions: this.skipNodeActionsBool,
      exit: this.exitBool,
      room: this.room,
      actions: this.action,
      inventoryAction: this.inventoryAction
    };
  }
}
