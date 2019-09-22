import React from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";

const IODevice = props => {
  const { interaction } = props;
  return (
    <div>
      <ReactMarkdown source={interaction.currentPage} />
      {interaction.options ? (
        <DecisionBar options={interaction.options} />
      ) : (
        <ParserBar />
      )}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    interaction: state.game.interaction
  };
};

export default connect(mapStateToProps)(IODevice);
