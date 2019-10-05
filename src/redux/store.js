import { createStore, applyMiddleware } from "redux";
import rootReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import Subscriber from "../game/subscriber";
import thunk from "redux-thunk";

export const initStore = () => {
  const store = createStore(rootReducer, applyMiddleware(thunk));
  registerStore(store);

  const subscriber = new Subscriber();
  store.subscribe(() => subscriber.subscribe());
};
