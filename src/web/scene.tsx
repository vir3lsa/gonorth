import React, { useState } from "react";
import { Box } from "@mui/system";
import { connect } from "react-redux";

interface Props {
  image?: string;
  location: string;
  gameStarted: boolean;
}

const SceneInner = (props: Props) => {
  const [imageDisplayed, setImageDisplayed] = useState(true);

  return (
    <>
      {props.gameStarted && (
        <Box
          data-testid="scene-bar"
          sx={{
            marginBottom: "8px",
            fontSize: "1em",
            color: "#222",
            background: "#eed",
            opacity: 0.8,
            padding: "1px 4px",
            borderRadius: "3px",
            fontWeight: 600,
            display: "flex"
          }}
        >
          <Box sx={{ flex: 1 }}>{props.location}</Box>
          {props.image && (
            <Box
              sx={{ textDecoration: "underline", cursor: "pointer" }}
              onClick={() => setImageDisplayed(!imageDisplayed)}
              data-testid="image-toggle"
            >
              <div role="button">{imageDisplayed ? "Hide Scene" : "Show Scene"}</div>
            </Box>
          )}
        </Box>
      )}
      {props.image && imageDisplayed && (
        <div
          data-testid="scene-image"
          style={{
            backgroundImage: `url(${props.image})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            height: props.image ? "49vw" : 0,
            maxHeight: "50%",
            marginBottom: props.image ? "8px" : 0,
            borderRadius: "3px"
          }}
        ></div>
      )}
    </>
  );
};

const mapStateToProps = (state: StoreState) => {
  return {
    image: state.image,
    location: state.room?.name || "", // TODO Need a separate state var for this.
    gameStarted: state.gameStarted
  };
};

export const Scene = connect(mapStateToProps)(SceneInner);
