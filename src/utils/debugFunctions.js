import { goToRoom } from "./lifecycle";
import { selectAllItemNames, selectItemNames, selectItems, selectRoom, selectRooms } from "./selectors";
import { Item } from "../game/items/item";
import disambiguate from "./disambiguation";

const helpText = `Usage: \`debug operation [args]\`
- e.g. \`debug show rooms\`
- e.g. \`debug goto kitchen\`

Operations:
- \`goto\`  - go to a room
- \`show\`  - list something
- \`list\`  - same as show
- \`spawn\` - create an item`;

export function handleDebugOperations(operation, ...args) {
  switch (operation.toLowerCase()) {
    case "goto":
      return goto(args);
    case "list":
    case "show":
      return show(args);
    case "help":
      return helpText;
    case "spawn":
      return spawn(args);
    default:
      return `Unrecognised debug operation: ${operation}`;
  }
}

function goto(args) {
  const roomName = args.map((arg) => arg.toLowerCase()).join(" ");
  const room = selectRooms()[roomName];

  if (room) {
    return goToRoom(room);
  } else {
    return `Couldn't find room "${roomName}".`;
  }
}

function show(args) {
  const whatToList = args.map((arg) => arg.toLowerCase()).join(" ");

  switch (whatToList) {
    case "rooms":
      return `Rooms:\n\n- ${Object.keys(selectRooms()).join("\n- ")}`;
    case "items":
    case "all items":
      return `Items:\n\n- ${[...selectAllItemNames()].join("\n- ")}`;
    case "available items":
      return `Items:\n\n- ${[...selectItemNames()].join("\n- ")}`;
    default:
      return `I don't know how to show ${whatToList}.`;
  }
}

function spawn(args) {
  const itemName = args.map((arg) => arg.toLowerCase()).join(" ");
  const itemsWithName = [...(selectItems()[itemName] || new Set())];
  let item;

  const spawnItem = (itemToSpawn) => {
    const room = selectRoom();
    room.addItem(itemToSpawn);
    return `Spawned ${itemName} in ${room.name}.`;
  };

  if (!itemsWithName.length) {
    item = new Item(itemName);
  } else if (itemsWithName.length === 1) {
    item = itemsWithName[0].clone();
  } else {
    return disambiguate(itemName, itemsWithName, (chosenItem) => spawnItem(chosenItem.clone()));
  }

  return spawnItem(item);
}