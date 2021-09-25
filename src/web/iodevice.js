import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import { Element, scroller } from "react-scroll";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";
import { SceneImage } from "./sceneImage";

const IODevice = (props) => {
  const { interaction } = props;

  useEffect(
    () =>
      scroller.scrollTo("scrollTarget", {
        smooth: "easeInQuad",
        duration: 1500,
        containerId: "scrollPane",
        ignoreCancelEvents: true
      }),
    [interaction.currentPage]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        margin: "8px",
        maxWidth: "100vh"
      }}
    >
      {props.image && <SceneImage />}
      <div id="scrollPane" style={{ flex: 2, overflow: "auto" }}>
        <ReactMarkdown source={interaction.currentPage} className="gonorth" />
        <Element name="scrollTarget" />
      </div>
      {interaction.options && interaction.options.length ? (
        <DecisionBar options={interaction.options} />
      ) : (
        <ParserBar />
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    interaction: state.game.interaction,
    image: state.game.image
  };
};

export default connect(mapStateToProps)(IODevice);
