import React from "react";
import { connect } from "react-redux";

interface Props {
  image?: string;
}

const SceneImageInner = (props: Props) => {
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

const mapStateToProps = (state: StoreState) => {
  return {
    image: state.image
  };
};

export const SceneImage = connect(mapStateToProps)(SceneImageInner);
