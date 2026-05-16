import React, { useRef, useEffect, useState, KeyboardEvent } from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { reactionTimePassed } from "../utils/sharedFunctions";
import { ButtonBaseActions } from "@mui/material";
import { OptionT } from "../types/types";

const LEFT_KEYS = ["ArrowLeft", "ArrowUp", "a", "w"];
const RIGHT_KEYS = ["ArrowRight", "ArrowDown", "d", "s"];

function selectOption(option: OptionT) {
  if (reactionTimePassed()) {
    option.action();
  }
}

interface Props {
  options: OptionT[];
  mobileMode: boolean;
}

export const DecisionBar: React.FC<Props> = ({ options, mobileMode }) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const actionRefs = useRef<Array<ButtonBaseActions | null>>([]);

  // Focus the first option, or the already focused one.
  useEffect(() => {
    const indexToFocus = focusedIndex > -1 && actionRefs.current.length > focusedIndex ? focusedIndex : 0;
    actionRefs.current[indexToFocus]?.focusVisible();
  });

  useEffect(() => {
    actionRefs.current = actionRefs.current.slice(0, options.length);
  }, [options]);

  // Navigate with arrow keys.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const maxIndex = actionRefs.current.length - 1;

    if (LEFT_KEYS.includes(event.key)) {
      actionRefs.current[index > 0 ? index - 1 : maxIndex]?.focusVisible();
    } else if (RIGHT_KEYS.includes(event.key)) {
      actionRefs.current[index < maxIndex ? index + 1 : 0]?.focusVisible();
    }
  };

  return (
    <Grid container spacing={1}>
      {options.map((option, index) => (
        <Grid item key={index}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => selectOption(option)}
            action={(actionObj) => (actionRefs.current[index] = actionObj)}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            sx={{ marginTop: mobileMode ? 1 : 0, marginBottom: 1 }}
          >
            {option.label}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
};
