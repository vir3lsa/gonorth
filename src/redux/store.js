import { createStore, applyMiddleware } from "redux";
import gameReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import thunk from "redux-thunk";

export const initStore = () => {
  const store = createStore(gameReducer, applyMiddleware(thunk));
  registerStore(store);
};
