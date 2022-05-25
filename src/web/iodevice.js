import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import { Element, scroller } from "react-scroll";
import { debounce } from "debounce";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";
import { SceneImage } from "./sceneImage";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles((theme) => ({
  scrollPane: {
    flex: 2,
    overflow: "auto"
  }
}));

const debouncedScroll = debounce(
  () =>
    scroller.scrollTo("scrollTarget", {
      smooth: "easeInQuad",
      duration: 1500,
      containerId: "scrollPane",
      ignoreCancelEvents: true
    }),
  10
);

const IODevice = (props) => {
  const { interaction } = props;
  const classes = useStyles();
  useEffect(debouncedScroll, [interaction.currentPage]);

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
      <div id="scrollPane" className={classes.scrollPane}>
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
    interaction: state.interaction,
    image: state.image
  };
};

export default connect(mapStateToProps)(IODevice);
