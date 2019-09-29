import React, { useRef, useEffect } from "react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

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
            onClick={option.action}
            buttonRef={index === 0 ? buttonRef : null}
          >
            {option.label}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
};
