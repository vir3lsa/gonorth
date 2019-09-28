import React from "react";
import TextField from "@material-ui/core/TextField";
import { store } from "../redux/store";
import { receivePlayerInput } from "../redux/gameActions";

const captureInput = event => {
  if (event.key === "Enter") {
    store.dispatch(receivePlayerInput(event.target.value));
  }
};

export const ParserBar = props => {
  return (
    <TextField
      id="parserBox"
      placeholder="What do you want to do?"
      fullWidth
      margin="normal"
      onKeyDown={captureInput}
    />
  );
};
