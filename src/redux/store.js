import { createStore } from "redux";
import rootReducer from "./reducers";
import { registerStore } from "./storeRegistry";

export const initStore = () => {
  registerStore(createStore(rootReducer));
};
