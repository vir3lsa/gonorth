import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { connect, useSelector } from "react-redux";
import { Element, animateScroll, scroller, Events, scrollSpy } from "react-scroll";
import { debounce } from "debounce";
import { DecisionBar } from "../decisionBar";
import { ParserBar } from "../parserBar";
import { Scene } from "../scene/scene";
import { Box } from "@mui/system";
import Feedback from "../Feedback";
import { Fab, Fade } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import usePrevious from "../../hooks/usePrevious";
import useAddedContent from "../../hooks/useAddedContent";
import "./iodevice.css";

const SCROLL_MARGIN_OF_ERROR = 5;
const SCROLL_ELEMENT_ID = "scrollPane";
const SCROLL_DISTANCE = 50;
const H6_MARKDOWN = "######";

let scrollIndex = 0;

const debouncedScroll = debounce(() => {
  if (scrollIndex) {
    scroller.scrollTo(`scrollPoint-${scrollIndex}`, {
      smooth: "easeInQuad",
      duration: 1500,
      containerId: SCROLL_ELEMENT_ID,
      ignoreCancelEvents: true
    });
  } else {
    animateScroll.scrollToTop({
      duration: 0,
      containerId: SCROLL_ELEMENT_ID,
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
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const { previousDifferent } = usePrevious(interaction.currentPage);
  const addition = useAddedContent({ older: previousDifferent, newer: interaction.currentPage });
  const previousLastLine = previousDifferent?.substring(previousDifferent.lastIndexOf("\n") + 1);
  const isUserAction = addition?.startsWith(`\n\n${H6_MARKDOWN}`) || previousLastLine?.startsWith(H6_MARKDOWN);

  const checkScrollPosition = () => {
    const scrollPane = scrollPaneRef.current;
    const scrollHeight = scrollPane?.scrollHeight ?? 0;
    const scrollTop = scrollPane?.scrollTop ?? 0;
    const clientHeight = scrollPane?.clientHeight ?? 0;
    const pixelsAway = Math.abs(scrollHeight - (scrollTop + clientHeight));
    setAtBottom(pixelsAway <= SCROLL_MARGIN_OF_ERROR);
  };

  // Scroll as necessary when current page changes.
  useEffect(() => {
    if (atBottom || autoScrolling || isUserAction) {
      setAutoScrolling(true);
      debouncedScroll();
    }
  }, [interaction.currentPage]);

  // Check the scroll position when the scene image is hidden or revealed.
  useEffect(checkScrollPosition, [sceneRevealed, scrollPaneRef.current, interaction.currentPage]);

  const handleScrollClick = () => {
    if (!scrolling) {
      setScrolling(true);
      const distance = scrollPaneRef.current!.clientHeight * 0.9;

      animateScroll.scrollMore(distance, {
        smooth: "easeInQuad",
        duration: 750,
        containerId: SCROLL_ELEMENT_ID,
        ignoreCancelEvents: true
      });
    }
  };

  const handleEnterScroll = () => {
    if (!scrolling) {
      animateScroll.scrollMore(SCROLL_DISTANCE, {
        smooth: "easeOutQuad",
        duration: 250,
        containerId: SCROLL_ELEMENT_ID,
        ignoreCancelEvents: true
      });
    }
  };

  const debouncedScrollHandler = debounce(checkScrollPosition);

  // Register scrolling event handlers.
  useEffect(() => {
    Events.scrollEvent.register("begin", () => setScrolling(true));
    Events.scrollEvent.register("end", () => {
      setScrolling(false);
      setAutoScrolling(false);
    });

    scrollSpy.update();

    return () => {
      Events.scrollEvent.remove("begin");
      Events.scrollEvent.remove("end");
    };
  }, []);

  // Render markdown if page has changed. Set scrollIndex as we go.
  const renderedMarkdown = useMemo(() => {
    scrollIndex = 0;
    let eventScrollPointAddedToLine: string;

    /* Function that renders a component, possibly adding a scroll point. */
    const renderComponent = (children: (ReactNode & ReactNode[]) | undefined, Tag: keyof JSX.IntrinsicElements) => {
      let addEventScrollPoint = false;

      if (!isUserAction) {
        // New text was added by an event, so we want to add a scroll point at the top of the new content.
        const firstString = children?.find((child) => typeof child === "string") as string | undefined;

        if (
          firstString &&
          (!eventScrollPointAddedToLine || firstString === eventScrollPointAddedToLine) &&
          addition?.includes(firstString)
        ) {
          addEventScrollPoint = true;
          eventScrollPointAddedToLine = firstString;
          scrollIndex++;
        }
      }

      return (
        <>
          {addEventScrollPoint && <Element name={`scrollPoint-${scrollIndex}`} />}
          <Tag>{children}</Tag>
        </>
      );
    };

    return (
      <ReactMarkdown
        children={interaction.currentPage}
        remarkPlugins={[remarkGfm] as ReactMarkdown.PluggableList}
        className="gonorth"
        components={{
          p({ children }) {
            return renderComponent(children, "p");
          },
          blockquote({ children }) {
            return renderComponent(children, "blockquote");
          },
          em({ children }) {
            return renderComponent(children, "em");
          },
          li({ children }) {
            return renderComponent(children, "li");
          },
          strong({ children }) {
            return renderComponent(children, "strong");
          },
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
    <div className="gn-io-device">
      <Scene />
      <Box className="gn-content-area">
        <Box id={SCROLL_ELEMENT_ID} ref={scrollPaneRef} onScroll={debouncedScrollHandler} className="gn-content-scroll">
          {renderedMarkdown}
          <Element name="scrollBottom" />
          <Fade in={!atBottom && !autoScrolling} timeout={1000}>
            <Box className="gn-overlay" />
          </Fade>
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
      <Box className="gn-input-container">
        <Box sx={{ flex: 1 }}>
          {interaction.options && interaction.options.length ? (
            <DecisionBar options={interaction.options} />
          ) : (
            <ParserBar onEnterScroll={handleEnterScroll} />
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
