import React from "react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

export const DecisionBar = props => {
  return (
    <Grid container spacing={1}>
      {props.options.map((option, index) => (
        <Grid item key={index}>
          <Button variant="outlined" color="primary" onClick={option.action}>
            {option.label}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
};
