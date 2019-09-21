import React from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";

const IODevice = props => {
  return (
    <div>
      <ReactMarkdown source={props.output} />
    </div>
  );
};

const mapStateToProps = state => {
  return {
    output: state.game.output
  };
};

export default connect(mapStateToProps)(IODevice);
