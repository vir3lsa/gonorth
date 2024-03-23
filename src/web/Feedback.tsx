import { Button, Card, CardActions, CardContent, Popover, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { selectConfig, selectRollingLog } from "../utils/selectors";
import { useDispatch, useSelector } from "react-redux";
import { toggleFeedback } from "../redux/gameActions";

const Feedback = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>();
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [submittedFeedback, setSubmittedFeedback] = useState<string>();
  const [submittedName, setSubmittedName] = useState<string>();
  const open = useSelector((state: StoreState) => state.feedbackOpen);
  const dispatch = useDispatch();

  const id = open ? "feedback-popover" : undefined;

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
    dispatch(toggleFeedback(true));
  };

  const handleClose = () => {
    setAnchorEl(undefined);
    dispatch(toggleFeedback(false));
  };

  const handleSubmit = () => {
    // Store current values so we don't submit them again.
    setSubmittedFeedback(feedback);
    setSubmittedName(name);

    // Call the feedback handler if one is present.
    selectConfig()?.feedbackHandler?.(feedback, name, selectRollingLog());
  };

  return (
    <>
      <Button variant="outlined" color="secondary" sx={{ marginBottom: "8px" }} onClick={handleOpen}>
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
        <Card variant="outlined" sx={{ width: 400, borderColor: "rgba(255, 255, 255, 0.4)" }}>
          <CardContent sx={{ p: 1, pb: 0 }}>
            <Typography variant="body2">Spotted a bug? Got a suggestion? Let me know about it:</Typography>
            <TextField
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              multiline
              placeholder="I saw a bug when..."
              rows={4}
              variant="outlined"
              fullWidth
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  pt: 1,
                  pb: 1,
                  pl: 1.5,
                  pr: 1.5,
                  "& > fieldset": {
                    borderColor: "#67778f"
                  },
                  "& textarea": {
                    fontSize: "1.1rem"
                  }
                },
                "& .MuiOutlinedInput-root:hover": {
                  "& > fieldset": {
                    borderColor: "#9be",
                    transition: "border-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms"
                  }
                }
              }}
            />
            <Typography variant="body2">Your name (optional):</Typography>
            <TextField
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              fullWidth
              variant="outlined"
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  pt: 1,
                  pb: 1,
                  pl: 1.5,
                  pr: 1.5,
                  "& > fieldset": {
                    borderColor: "#67778f"
                  },
                  "& input": {
                    fontSize: "1.1rem",
                    padding: 0
                  }
                },
                "& .MuiOutlinedInput-root:hover": {
                  "& > fieldset": {
                    borderColor: "#9be",
                    transition: "border-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms"
                  }
                }
              }}
            />
          </CardContent>
          <CardActions>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleSubmit}
              disabled={feedback.length < 3 || (feedback === submittedFeedback && name === submittedName)}
            >
              Submit
            </Button>
          </CardActions>
        </Card>
      </Popover>
    </>
  );
};

export default Feedback;
