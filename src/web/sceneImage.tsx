import React from "react";
import { Box } from "@mui/system";
import { connect } from "react-redux";

interface Props {
  image?: string;
  location: string;
}

const SceneImageInner = (props: Props) => {
  return (
    <>
      <Box
        sx={{
          marginBottom: "8px",
          fontSize: "1em",
          color: "#222",
          background: "#eed",
          opacity: 0.8,
          padding: "1px",
          paddingLeft: "4px",
          borderRadius: "3px",
          fontWeight: 600
        }}
      >
        {props.location}
      </Box>
      <div
        style={{
          backgroundImage: `url(${props.image})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          height: props.image ? "49vw" : 0,
          maxHeight: "50%",
          marginBottom: props.image ? "8px" : 0
        }}
      ></div>
    </>
  );
};

const mapStateToProps = (state: StoreState) => {
  return {
    image: state.image,
    location: state.room?.name || "" // TODO Need a separate state var for this.
  };
};

export const SceneImage = connect(mapStateToProps)(SceneImageInner);
