import React, { useRef, useEffect } from "react";
import { connect } from "react-redux";

const SceneImage = (props) => {
  return <div background={props.image.src}></div>;
};

const mapStateToProps = (state) => {
  return {
    image: state.game.image
  };
};

export default connect(mapStateToProps)(SceneImage);
