import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import { animateScroll } from "react-scroll";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";

const IODevice = props => {
  const { interaction } = props;

  useEffect(
    () =>
      animateScroll.scrollToBottom({
        smooth: "easeInQuad",
        duration: 1500
      }),
    [interaction.currentPage]
  );

  return (
    <div>
      <ReactMarkdown source={interaction.currentPage} className="gonorth" />
      {interaction.options && interaction.options.length ? (
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
