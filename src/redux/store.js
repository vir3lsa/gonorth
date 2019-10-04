import { createStore } from "redux";
import rootReducer from "./reducers";
import { registerStore } from "./storeRegistry";
import Subscriber from "../game/subscriber";

export const initStore = () => {
  const store = createStore(rootReducer);
  registerStore(store);

  const subscriber = new Subscriber();
  store.subscribe(() => subscriber.subscribe());
};
