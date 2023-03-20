import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { connect, useSelector } from "react-redux";
import { Element, scroller } from "react-scroll";
import { debounce } from "debounce";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";
import { SceneImage } from "./sceneImage";
import { Box } from "@mui/system";
import Feedback from "./Feedback";

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

interface Props {
  interaction: InteractionT;
  image?: string;
}

const IODevice = (props: Props) => {
  const { interaction } = props;
  const renderFeedbackBox = useSelector((state: StoreState) => state.game?.config.renderFeedbackBox);
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
      <Box id="scrollPane" sx={{ flex: 2, overflow: "auto" }}>
        <ReactMarkdown
          children={interaction.currentPage}
          remarkPlugins={[remarkGfm] as ReactMarkdown.PluggableList}
          className="gonorth"
        />
        <Element name="scrollTarget" />
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "end", marginTop: 1 }}>
        <Box sx={{ flex: 1 }}>
          {interaction.options && interaction.options.length ? (
            <DecisionBar options={interaction.options} />
          ) : (
            <ParserBar />
          )}
        </Box>
        <div>
          {/* div is the flex item here so we can potentially put multiple things inside it. */}
          {renderFeedbackBox && <Feedback />}
        </div>
      </Box>
    </div>
  );
};

const mapStateToProps = (state: StoreState) => {
  return {
    interaction: state.interaction,
    image: state.image
  };
};

export default connect(mapStateToProps)(IODevice);