import { goToRoom } from "./lifecycle";
import {
  selectAllItemNames,
  selectCyCommands,
  selectItemNames,
  selectItems,
  selectOptionGraphs,
  selectRoom,
  selectRooms
} from "./selectors";
import { newItem } from "../game/items/item";
import disambiguate from "./disambiguation";
import { getStore } from "../redux/storeRegistry";
import { cyRecord, itemsRevealed, overrideEventTimeout } from "../redux/gameActions";
import { forget, retrieve, store, update } from "../gonorth";

const helpText = `Usage: \`debug operation [args]\`
- e.g. \`debug show rooms\`
- e.g. \`debug goto kitchen\`

Operations:
- \`help\`                                         - show debug help
- \`goto\` / \`go\`                                - go to a room
- \`show\` / \`list\`                              - list something
- \`spawn\` / \`create\` / \`make\`                - create an item
- \`commence\` / \`graph\` / \`join\` / \`start \` - join an option graph at the specified node, or the default node
- \`cypress\` / \`integration\` / \`test\`         - produce Cypress commands from the actions you perform
- \`event\` / \`timeout\`                          - override event timeouts
- \`variable\` / \`var\`                           - store, update, retrieve and forget persistent variables`;

const gotoHelp = `Usage: \`debug goto [room]\`
- e.g. \`debug goto kitchen\`
- e.g. \`debug goto cellar\``;

const showHelp = `Usage: \`debug show [something] [id]\`
- e.g. \`debug show rooms\`
- e.g. \`debug show graph cat\`

Options:
- \`rooms\`           - list all room names
- \`items\`           - list all item names (not including aliases)
- \`available items\` - list all item names that can be interacted with in the current room (including aliases)\`
- \`graphs\`          - list all option graph IDs
- \`nodes [id]\`      - list all node IDs for the given option graph ID\``;

const spawnHelp = `Usage: \`debug spawn [item]\`
- e.g. \`debug spawn ball\`
- e.g. \`debug spawn potion\``;

const commenceHelp = `Usage: \`debug commence [graph] [node]\`
- e.g. \`debug commence conversation\`
- e.g. \`debug commence conversation weather\``;

const cypressHelp = `Usage: \`debug cypress [command]\`

Commands:
- \`record\`           - start recording Cypress commands
- \`print\` / \'list\' - list Cypress commands for recorded sequence of events

Examples:
- e.g. \`debug cypress record\`
- e.g. \`debug cypress print\``;

const eventHelp = `Usage: \`debug event [timeout_millis|reset]\`
- e.g. \`debug event 10\`
- e.g. \`debug timeout 2000\`
- e.g. \`debug event reset\``;

const variableHelp = `Usage: \`debug variable [store|update|retrieve|forget] [name] [value]\`

Commands:
- \`help\`               - show this help text
- \`store\ / \`set\`     - store a persistent variable with the given value
- \`update\`             - update the value of an existing persistent variable
- \`retrieve\` / \`get\` - retrieve the current value of a persistent variable
- \`forget\` / \`erase\` - erase a persistent variable

Examples:
- e.g. \`debug variable store invisibilityMode true\`
- e.g. \`debug variable update colourMode red\`
- e.g. \`debug variable retrieve colourMode\`
- e.g. \`debug variable forget invisibilityMode\``;

export function handleDebugOperations(operation, ...args) {
  if (!operation) {
    return helpText;
  }

  switch (operation.toLowerCase()) {
    case "go":
    case "goto":
      return goto(args);
    case "list":
    case "show":
      return show(args);
    case "help":
      return helpText;
    case "create":
    case "make":
    case "spawn":
      return spawn(args);
    case "commence":
    case "graph":
    case "join":
    case "start":
      return commence(args);
    case "cypress":
    case "integration":
    case "test":
      return cypress(args);
    case "event":
    case "timeout":
      return events(args);
    case "var":
    case "variable":
      return variable(args);
    default:
      return `Unrecognised debug operation: ${operation}`;
  }
}

function goto(args) {
  if (args.length === 1 && args[0] === "help") {
    return gotoHelp;
  }

  const roomName = args.map((arg) => arg.toLowerCase()).join(" ");
  const room = selectRooms()[roomName];

  if (room) {
    return goToRoom(room);
  } else {
    return `Couldn't find room "${roomName}".`;
  }
}

function show(args) {
  if (args.length === 1 && args[0] === "help") {
    return showHelp;
  }

  let argsIndex = 0;
  let whatToList = args[argsIndex].toLowerCase();

  while (true) {
    switch (whatToList) {
      case "rooms":
        return `Rooms:\n\n- ${Object.keys(selectRooms()).join("\n- ")}`;
      case "items":
      case "all items":
        return `Items:\n\n- ${[...selectAllItemNames()].join("\n- ")}`;
      case "available items":
        return `Items:\n\n- ${[...selectItemNames()].join("\n- ")}`;
      case "option graphs":
      case "optiongraphs":
      case "options":
      case "graphs":
        return `Option Graphs:\n\n- ${Object.keys(selectOptionGraphs()).join("\n- ")}`;
      case "nodes":
      case "option graph":
      case "optiongraph":
      case "graph":
        return showNodes(args, argsIndex);
      default:
        if (argsIndex < args.length - 1) {
          argsIndex++;
          whatToList += ` ${args[argsIndex].toLowerCase()}`;
        } else {
          return `I don't know how to show ${whatToList}.`;
        }
    }
  }
}

function showNodes(args, argsIndex) {
  if (argsIndex >= args.length - 1) {
    return "Can't list nodes - no option graph ID provided.";
  }

  const id = args.slice(argsIndex + 1).join(" ");
  const optionGraph = selectOptionGraphs()[id];

  if (!optionGraph) {
    return `Can't list nodes - no option graph with ID ${id} found.`;
  }

  return `Nodes:\n\n- ${optionGraph.nodes.map((node) => node.id).join("\n- ")}`;
}

function spawn(args) {
  if (args.length === 1 && args[0] === "help") {
    return spawnHelp;
  }

  const itemName = args.map((arg) => arg.toLowerCase()).join(" ");
  const itemsWithName = [...(selectItems()[itemName] || new Set())];
  let item;

  const spawnItem = (itemToSpawn) => {
    const room = selectRoom();
    room.addItem(itemToSpawn);
    getStore().dispatch(itemsRevealed([itemToSpawn.name, ...itemToSpawn.aliases]));
    return `Spawned ${itemName} in ${room.name}.`;
  };

  if (!itemsWithName.length) {
    item = newItem({ name: itemName, holdable: true });
  } else if (itemsWithName.length === 1) {
    item = itemsWithName[0].clone();
  } else {
    return disambiguate(itemName, itemsWithName, (chosenItem) => spawnItem(chosenItem.clone()));
  }

  return spawnItem(item);
}

function commence(args) {
  if (args.length === 1 && args[0] === "help") {
    return commenceHelp;
  }

  let argsIndex = 0;
  let graphId = args[argsIndex];
  let graphs = selectOptionGraphs();

  while (true) {
    const graph = graphs[graphId];

    if (graph) {
      if (argsIndex < args.length - 1) {
        const nodeId = args.slice(argsIndex + 1).join(" ");

        if (graph.flattened[nodeId]) {
          return graph.commence(nodeId).chain();
        }
      } else {
        return graph.commence().chain();
      }
    }

    if (argsIndex < args.length - 1) {
      argsIndex++;
      graphId += ` ${args[argsIndex]}`;
    } else {
      return `Unable to find option graph and node using input ${args.join(" ")}`;
    }
  }
}

function cypress(args) {
  if (args.length === 1 && args[0] === "help") {
    return cypressHelp;
  } else if (args.length === 1) {
    if (args[0] === "record") {
      getStore().dispatch(cyRecord());
      return "Recording commands.";
    } else if (args[0] === "print" || args[0] === "list") {
      return `* ${selectCyCommands().join("\n* ")}`;
    }
  }
}

function events(args) {
  if (args.length === 1 && args[0] === "help") {
    return eventHelp;
  } else if (args.length >= 1) {
    if (args[0] === "reset") {
      getStore().dispatch(overrideEventTimeout(null, null));
      return "Event timeouts reset to defaults.";
    }

    const timeout = new Number(args[0]);
    const turns = args.length > 1 ? new Number(args[1]) : undefined;
    getStore().dispatch(overrideEventTimeout(timeout, turns));
    return `Event timeouts set to ${timeout} milliseconds${turns !== undefined ? " and " + turns + " turn(s)" : ""}.`;
  }
}

function variable(args) {
  if (args.length === 1 && args[0] === "help") {
    return variableHelp;
  } else if (args.length > 1) {
    if (["store", "set"].includes(args[0]) && args.length === 3) {
      store(args[1], parseVariableValue(args[2]));
      return "Variable stored.";
    } else if (args[0] === "update" && args.length === 3) {
      update(args[1], parseVariableValue(args[2]));
      return "Variable updated.";
    } else if (["retrieve", "get"].includes(args[0])) {
      return `${args[1]}: ${retrieve(args[1])}`;
    } else if (["forget", "erase"].includes(args[0])) {
      forget(args[1]);
      return "Variable forgotten.";
    }
  }
}

function parseVariableValue(raw) {
  const lowerRaw = raw.toLowerCase();

  if (lowerRaw === "true") {
    return true;
  } else if (lowerRaw === "false") {
    return false;
  }

  return raw;
}
