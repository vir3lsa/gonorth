import { createStore, applyMiddleware } from "redux";
import gameReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import thunk from "redux-thunk";
import { SnapshotPersistor } from "./snapshotPersistor";
import { loadSnapshot } from "./gameActions";

export const initStore = () => {
  const store = createStore(gameReducer, applyMiddleware(thunk));
  const persistor = new SnapshotPersistor(store, loadSnapshot, {
    version: 2,
    whitelist: ["turn", "itemNames"],
    serializers: { itemNames: (value) => [...value] },
    deserializers: { itemNames: (value) => new Set(value) }
  });
  registerStore(store, persistor);
};
