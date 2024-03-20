import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { connect, useSelector } from "react-redux";
import { Element, animateScroll, scroller, Events, scrollSpy } from "react-scroll";
import { debounce } from "debounce";
import { DecisionBar } from "./decisionBar";
import { ParserBar } from "./parserBar";
import { Scene } from "./scene";
import { Box } from "@mui/system";
import Feedback from "./Feedback";
import { Fab, Fade } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const SCROLL_MARGIN_OF_ERROR = 3;
let scrollIndex = 0;

const debouncedScroll = debounce(() => {
  if (scrollIndex) {
    scroller.scrollTo(`scrollPoint-${scrollIndex}`, {
      smooth: "easeInQuad",
      duration: 1500,
      containerId: "scrollPane",
      ignoreCancelEvents: true
    });
  } else {
    animateScroll.scrollToTop({
      duration: 0,
      containerId: "scrollPane",
      ignoreCancelEvents: true
    });
  }
}, 10);

interface Props {
  interaction: InteractionT;
  image?: string;
}

const IODevice = (props: Props) => {
  const { interaction } = props;
  const renderFeedbackBox = useSelector((state: StoreState) => state.game?.config.renderFeedbackBox);
  const sceneRevealed = useSelector((state: StoreState) => state.sceneRevealed);
  const [scrolling, setScrolling] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const scrollPaneRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = () => {
    const scrollPane = scrollPaneRef.current;
    const scrollHeight = scrollPane?.scrollHeight ?? 0;
    const scrollTop = scrollPane?.scrollTop ?? 0;
    const clientHeight = scrollPane?.clientHeight ?? 0;
    const pixelsAway = Math.abs(scrollHeight - (scrollTop + clientHeight));
    setAtBottom(pixelsAway <= SCROLL_MARGIN_OF_ERROR);
  };

  // Scroll as necessary when current page changes.
  useEffect(() => debouncedScroll(), [interaction.currentPage]);

  // Check the scroll position when the scene image is hidden or revealed.
  useEffect(checkScrollPosition, [sceneRevealed, scrollPaneRef.current, interaction.currentPage]);

  const handleScrollClick = () => {
    if (!scrolling) {
      setScrolling(true);
      const distance = scrollPaneRef.current!.clientHeight * 0.9;

      animateScroll.scrollMore(distance, {
        smooth: "easeInQuad",
        duration: 750,
        containerId: "scrollPane",
        ignoreCancelEvents: true
      });
    }
  };

  const debouncedScrollHandler = debounce(checkScrollPosition);

  // Register scrolling event handlers.
  useEffect(() => {
    Events.scrollEvent.register("begin", () => setScrolling(true));
    Events.scrollEvent.register("end", () => setScrolling(false));

    scrollSpy.update();

    return () => {
      Events.scrollEvent.remove("begin");
      Events.scrollEvent.remove("end");
    };
  }, []);

  // Render markdown if page has changed. Set scrollIndex as we go.
  const renderedMarkdown = useMemo(() => {
    scrollIndex = 0;
    return (
      <ReactMarkdown
        children={interaction.currentPage}
        remarkPlugins={[remarkGfm] as ReactMarkdown.PluggableList}
        className="gonorth"
        components={{
          h6({ children }) {
            scrollIndex++;
            return (
              <>
                <Element name={`scrollPoint-${scrollIndex}`} />
                <h6>{children}</h6>
              </>
            );
          }
        }}
      />
    );
  }, [interaction.currentPage]);

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
      <Scene />
      <Box sx={{ flex: 2, position: "relative", overflow: "auto" }}>
        <Box
          id="scrollPane"
          ref={scrollPaneRef}
          onScroll={debouncedScrollHandler}
          sx={{ overflow: "auto", height: "100%", maxHeight: "100%", position: "relative" }}
        >
          {renderedMarkdown}
          <Element name="scrollBottom" />
        </Box>
        <Fade in={!scrolling && !atBottom} {...(!scrolling ? { timeout: 1000 } : {})}>
          <Fab
            size="small"
            color="primary"
            sx={{ position: "absolute", right: "12px", bottom: "0px" }}
            aria-label="scroll down"
            onClick={handleScrollClick}
          >
            <KeyboardArrowDownIcon />
          </Fab>
        </Fade>
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
