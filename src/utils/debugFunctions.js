import { goToRoom } from "./lifecycle";
import { selectRooms } from "./selectors";

const helpText = `Usage: \`debug operation [args]\`
- e.g. \`debug show rooms\`
- e.g. \`debug goto kitchen\`

Operations:
- \`goto\` - go to a room
- \`show\` - list something`;

export function handleDebugOperations(operation, ...args) {
  switch (operation.toLowerCase()) {
    case "goto": {
      const roomName = args.map((arg) => arg.toLowerCase()).join(" ");
      const room = selectRooms()[roomName];
      if (room) {
        return goToRoom(room);
      } else {
        return `Couldn't find room "${roomName}".`;
      }
    }
    case "show": {
      const whatToList = args.map((arg) => arg.toLowerCase()).join(" ");
      if (whatToList === "rooms") {
        return `Rooms:\n\n- ${Object.keys(selectRooms()).join("\n- ")}`;
      } else {
        return `I don't know how to show ${whatToList}.`;
      }
    }
    case "help": {
      return helpText;
    }
    default: {
      return `Unrecognised debug operation: ${operation}`;
    }
  }
}
