import React from "react";
import { Provider } from "react-redux";
import { getStore } from "../redux/storeRegistry";
import Iodevice from "./iodevice";

export const GoNorth = () => (
  <Provider store={getStore()}>
    <Iodevice />
  </Provider>
);
