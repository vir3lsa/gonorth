import React, { useEffect, useRef } from "react";
import TextField from "@material-ui/core/TextField";
import { receiveInput } from "../utils/inputReceiver";
import { reactionTimePassed } from "../utils/sharedFunctions";

let historyIndex = 0;
let history = [];
const maxHistory = 500;

history[0] = "";

const captureInput = event => {
  if (event.key === "Enter" && reactionTimePassed()) {
    const value = event.target.value;
    receiveInput(value);

    // Reset input
    event.target.value = "";

    // Record history
    if (!history.length || value !== history[1]) {
      history.unshift(value);
      history[1] = value; // In case we didn't have a working value
    }

    if (history.length > maxHistory + 1) {
      history = history.slice(0, maxHistory + 1);
    }

    // Blank the working value
    history[0] = "";
    historyIndex = 0;
  }
};

const handleChange = event => {
  const value = event.target.value;

  if (historyIndex > 0 && value !== history[historyIndex]) {
    // We've edited a history item - it's our new working value
    historyIndex = 0;
  }

  if (historyIndex === 0) {
    // Record our new working value
    history[0] = value;
  }
};

const handleArrows = event => {
  if (event.key === "ArrowUp" && historyIndex < history.length - 1) {
    historyIndex++;
  } else if (event.key === "ArrowDown" && historyIndex > 0) {
    historyIndex--;
  } else {
    return;
  }

  const textField = event.target;
  textField.value = history[historyIndex];
  textField.selectionStart = textField.value.length;
  textField.selectionEnd = textField.value.length;
  event.preventDefault();
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
      onKeyDown={handleArrows}
      onKeyUp={captureInput}
      onChange={handleChange}
      inputRef={inputRef}
      autoComplete="off"
    />
  );
};
