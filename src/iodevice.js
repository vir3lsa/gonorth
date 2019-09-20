import React from "react";
import { connect } from "react-redux";

const IODevice = props => {
  return (
    <div>
      <div>{props.output}</div>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    output: state.game.output
  };
};

export default connect(mapStateToProps)(IODevice);
