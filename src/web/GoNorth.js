import { createTheme } from "@mui/material";
import { ThemeProvider } from "@mui/styles";
import React from "react";
import { Provider } from "react-redux";
import { getStore } from "../redux/storeRegistry";
import Iodevice from "./iodevice";

const theme = createTheme();

export const GoNorth = () => (
  <ThemeProvider theme={theme}>
    <Provider store={getStore()}>
      <Iodevice />
    </Provider>
  </ThemeProvider>
);
