import React, { useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { reactionTimePassed } from "../utils/sharedFunctions";

function selectOption(option) {
  if (reactionTimePassed()) {
    option.action();
  }
}

export const DecisionBar = props => {
  const buttonRef = useRef();

  // Focus the first option
  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  });

  return (
    <Grid container spacing={1}>
      {props.options.map((option, index) => (
        <Grid item key={index}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => selectOption(option)}
            ref={index === 0 ? buttonRef : null}
          >
            {option.label}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
};
