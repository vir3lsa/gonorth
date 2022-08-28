import { createTheme } from "@mui/material";
import { deepPurple, pink, purple, teal } from "@mui/material/colors";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { Provider } from "react-redux";
import { getStore } from "../redux/storeRegistry";
import Iodevice from "./iodevice";

const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "standard"
      }
    }
  },
  palette: {
    secondary: purple
  }
});

export const GoNorth = () => (
  <ThemeProvider theme={theme}>
    <Provider store={getStore()}>
      <Iodevice />
    </Provider>
  </ThemeProvider>
);
