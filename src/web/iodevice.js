import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";

const IODevice = props => {
  const { interaction } = props;
  const scrollToRef = useRef(null);

  const scrollToEnd = () =>
    scrollToRef.current.scrollIntoView({ behaviour: "smooth" });

  useEffect(scrollToEnd, [interaction.currentPage]);

  return (
    <div>
      <ReactMarkdown source={interaction.currentPage} className="gonorth" />
      {interaction.options && interaction.options.length ? (
        <DecisionBar options={interaction.options} />
      ) : (
        <ParserBar />
      )}
      <div ref={scrollToRef} />
    </div>
  );
};

const mapStateToProps = state => {
  return {
    interaction: state.game.interaction
  };
};

export default connect(mapStateToProps)(IODevice);
