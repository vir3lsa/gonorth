import { createStore, applyMiddleware } from "redux";
import gameReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import thunk from "redux-thunk";
import { SnapshotPersistor } from "./snapshotPersistor";
import { loadSnapshot } from "./gameActions";
import { selectRooms } from "../utils/selectors";
import { initialState } from "./reducers/gameReducer";

export const initStore = () => {
  const store = createStore(gameReducer, applyMiddleware(thunk));
  const persistor = new SnapshotPersistor(store, loadSnapshot, initialState, {
    version: 4,
    whitelist: ["turn", "itemNames", "room"],
    serializers: { itemNames: (value) => [...value], room: (room) => room.name.toLowerCase() },
    deserializers: {
      itemNames: (value) => new Set(value),
      room: (roomName) => {
        const rooms = selectRooms();
        const room = rooms[roomName];
        if (!room) {
          console.error(`Attempted to load room with name "${roomName}" but no such room exists.`);
        }
        return room;
      }
    }
  });
  registerStore(store, persistor);
};
