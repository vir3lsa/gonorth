import React from "react";
import { connect } from "react-redux";

const SceneImageInner = (props) => {
  return (
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
  );
};

const mapStateToProps = (state) => {
  return {
    image: state.game.image
  };
};

export const SceneImage = connect(mapStateToProps)(SceneImageInner);
