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
        width: "100%",
        flex: 1,
        marginBottom: "8px"
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
