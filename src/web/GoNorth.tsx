import { createTheme } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { Provider } from "react-redux";
import { getStore } from "../redux/storeRegistry";
import Iodevice from "./iodevice";

const fonts = ["masaakiregular", '"Roboto"', '"Helvetica"', '"Arial"', "sans-serif"].join(",");

const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "standard"
      },
      styleOverrides: {
        root: {
          fontFamily: fonts
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: "#9be"
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderColor: "#9be"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: fonts
        }
      }
    }
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#9be"
    },
    secondary: {
      main: "#ffffbd"
    }
  },
  typography: {
    fontFamily: fonts,
    body1: {
      color: "#ccccb1"
    },
    body2: {
      color: "#ffffbd",
      fontSize: "1.1rem"
    }
  }
});

export const GoNorth = () => (
  <ThemeProvider theme={theme}>
    <Provider store={getStore()}>
      <Iodevice />
    </Provider>
  </ThemeProvider>
);
