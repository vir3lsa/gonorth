import React, { useEffect, useRef } from "react";
import TextField from "@material-ui/core/TextField";
import { getStore } from "../redux/storeRegistry";
import { receivePlayerInput } from "../redux/gameActions";

const captureInput = event => {
  if (event.key === "Enter") {
    getStore().dispatch(receivePlayerInput(event.target.value));

    // Reset input
    event.target.value = "";
  }
};

export const ParserBar = props => {
  const inputRef = useRef();

  // Focus the text field
  useEffect(() => inputRef.current.focus());

  return (
    <TextField
      id="parserBox"
      placeholder="What do you want to do?"
      fullWidth
      margin="normal"
      onKeyUp={captureInput}
      inputRef={inputRef}
    />
  );
};
