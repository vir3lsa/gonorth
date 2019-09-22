import React from "react";
import Button from "@material-ui/core/Button";

export const DecisionBar = props => {
  return (
    <div>
      {props.options.map((option, index) => (
        <Button
          key={index}
          variant="outlined"
          color="primary"
          onClick={option.action}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
