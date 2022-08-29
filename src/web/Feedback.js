import { Button, Card, CardActions, CardContent, Paper, Popover, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

const Feedback = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "feedback-popover" : undefined;

  return (
    <>
      <Button variant="outlined" color="secondary" sx={{ marginBottom: "8px" }} onClick={handleClick}>
        Feedback
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
      >
        <Card variant="outlined" sx={{ width: 400 }}>
          <CardContent sx={{ p: 1 }}>
            <Typography>Spotted a bug? Got a suggestion? Let me know about it:</Typography>
            <TextField multiline placeholder="I saw a bug when..." rows={4} variant="outlined" fullWidth />
          </CardContent>
          <CardActions>
            <Button variant="outlined" color="secondary">
              Submit
            </Button>
          </CardActions>
        </Card>
      </Popover>
    </>
  );
};

export default Feedback;
