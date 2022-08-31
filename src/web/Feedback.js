import { Button, Card, CardActions, CardContent, Paper, Popover, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

const Feedback = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [submittedFeedback, setSubmittedFeedback] = useState();
  const [submittedName, setSubmittedName] = useState();

  const open = Boolean(anchorEl);
  const id = open ? "feedback-popover" : undefined;

  const handleSubmit = () => {
    const feedbackObj = {
      feedback,
      name,
      logs: []
    };

    setSubmittedFeedback(feedback);
    setSubmittedName(name);

    console.log(feedbackObj);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ marginBottom: "8px" }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        Feedback
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
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
