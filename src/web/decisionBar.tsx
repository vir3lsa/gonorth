import React, { useRef, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { reactionTimePassed } from "../utils/sharedFunctions";
import { ButtonBaseActions } from "@mui/material";

function selectOption(option: OptionT) {
  if (reactionTimePassed()) {
    option.action();
  }
}

interface Props {
  options: OptionT[];
}

export const DecisionBar = ({ options }: Props) => {
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
            sx={{ marginBottom: 1 }}
          >
            {option.label}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
};
