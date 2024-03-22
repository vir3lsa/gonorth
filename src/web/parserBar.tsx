import React, { ChangeEvent, FC, KeyboardEvent, useEffect, useRef } from "react";
import TextField from "@mui/material/TextField";
import { receiveInput } from "../game/input/inputReceiver";
import { reactionTimePassed } from "../utils/sharedFunctions";

const MAX_HISTORY = 500;

let historyIndex = 0;
let history: string[] = [];

history[0] = "";

const captureInput = (event: KeyboardEvent<HTMLDivElement>, onEnterScroll: () => void) => {
  if (event.key === "Enter" && reactionTimePassed()) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (value && value.length) {
      receiveInput(value);

      // Reset input
      target.value = "";

      // Record history
      if (!history.length || value !== history[1]) {
        history.unshift(value);
        history[1] = value; // In case we didn't have a working value
      }

      if (history.length > MAX_HISTORY + 1) {
        history = history.slice(0, MAX_HISTORY + 1);
      }

      // Blank the working value
      history[0] = "";
      historyIndex = 0;
    } else {
      onEnterScroll();
    }
  }
};

const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
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

const handleArrows = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "ArrowUp" && historyIndex < history.length - 1) {
    historyIndex++;
  } else if (event.key === "ArrowDown" && historyIndex > 0) {
    historyIndex--;
  } else {
    return;
  }

  const textField = event.target as HTMLInputElement;
  textField.value = history[historyIndex];
  textField.selectionStart = textField.value.length;
  textField.selectionEnd = textField.value.length;
  event.preventDefault();
};

interface Props {
  onEnterScroll: () => void;
}

export const ParserBar: FC<Props> = ({ onEnterScroll }) => {
  const inputRef = useRef<HTMLInputElement>();

  // Focus the text field
  useEffect(() => inputRef.current?.focus());

  return (
    <TextField
      id="parserBox"
      placeholder="What do you want to do?"
      fullWidth
      margin="normal"
      onKeyDown={handleArrows}
      onKeyUp={(event) => captureInput(event, onEnterScroll)}
      onChange={handleChange}
      inputRef={inputRef}
      autoComplete="off"
      color="primary"
      sx={{
        "& .MuiInput-root": {
          borderColor: "#67778f",
          "&:before": {
            borderColor: "#67778f"
          },
          "&:hover:not(.Mui-disabled):before": {
            borderBottom: "1px solid #9be"
          }
        }
      }}
    />
  );
};
