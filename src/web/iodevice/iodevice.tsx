import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import usePrevious from "../../hooks/usePrevious";
import useAddedContent from "../../hooks/useAddedContent";
import "./iodevice.css";

const SCROLL_MARGIN_OF_ERROR = 5;
const SCROLL_ELEMENT_ID = "scrollPane";
const SCROLL_DISTANCE = 50;
const H6_MARKDOWN = "######";

let scrollIndex = 0;

const debouncedScroll = debounce((reverse = false) => {
  if (reverse) {
    animateScroll.scrollToTop({
      smooth: "easeInOutQuad",
      duration: 1000,
      containerId: SCROLL_ELEMENT_ID,
      ignoreCancelEvents: true
    });
  } else if (scrollIndex) {
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
  reverseInteraction: InteractionT;
  mobileMode?: boolean;
}

const IODevice: React.FC<Props> = ({ interaction: forwardInteraction, reverseInteraction, mobileMode = false }) => {
  const interaction = mobileMode ? reverseInteraction : forwardInteraction;

  // Redux store state
  const renderFeedbackBox = useSelector((state: StoreState) => state.game?.config.renderFeedbackBox);
  const sceneRevealed = useSelector((state: StoreState) => state.sceneRevealed);

  // Refs
  const scrollPaneRef = useRef<HTMLDivElement>(null);

  // Local state
  const [scrolling, setScrolling] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(scrollPaneRef.current?.scrollHeight ?? 0);

  // Misc
  const { previous, previousDifferent } = usePrevious(interaction.currentPage);
  const addition = useAddedContent({ older: previousDifferent, newer: interaction.currentPage });
  const recentAddition = useAddedContent({ older: previous, newer: interaction.currentPage });

  // Derived
  const previousLastLine = previousDifferent?.substring(previousDifferent.lastIndexOf("\n") + 1);
  const previousFirstLine = previousDifferent?.substring(0, previousDifferent.indexOf("\n"));
  const isUserAction =
    (mobileMode && (addition?.includes(H6_MARKDOWN) || previousFirstLine?.startsWith(H6_MARKDOWN))) ||
    (!mobileMode && (addition?.startsWith(`\n\n${H6_MARKDOWN}`) || previousLastLine?.startsWith(H6_MARKDOWN)));

  useEffect(() => {
    // Scroll down when text is added in mobile mode, to maintain scroll position.
    if (mobileMode && recentAddition?.length) {
      const scrollHeightChange = (scrollPaneRef.current?.scrollHeight ?? 0) - previousScrollHeight;
      setPreviousScrollHeight(scrollPaneRef.current?.scrollHeight ?? 0);

      if (scrollHeightChange) {
        animateScroll.scrollMore(scrollHeightChange, {
          duration: 0,
          containerId: SCROLL_ELEMENT_ID,
          ignoreCancelEvents: true
        });
      }
    }
  }, [scrollPaneRef.current?.scrollHeight, previousScrollHeight, mobileMode, recentAddition]);

  const checkScrollPosition = () => {
    const scrollPane = scrollPaneRef.current;
    const scrollHeight = scrollPane?.scrollHeight ?? 0;
    const scrollTop = scrollPane?.scrollTop ?? 0;
    const clientHeight = scrollPane?.clientHeight ?? 0;
    const pixelsFromBottom = Math.abs(scrollHeight - (scrollTop + clientHeight));
    setAtBottom(pixelsFromBottom <= SCROLL_MARGIN_OF_ERROR);
    setAtTop(scrollTop <= SCROLL_MARGIN_OF_ERROR);
  };

  // Scroll as necessary when current page changes.
  useEffect(() => {
    if ((mobileMode && atTop) || (!mobileMode && atBottom) || autoScrolling || isUserAction) {
      setAutoScrolling(true);
      debouncedScroll(mobileMode);
    }
  }, [interaction.currentPage]);

  // Check the scroll position when the scene image is hidden or revealed.
  useEffect(checkScrollPosition, [sceneRevealed, scrollPaneRef.current, interaction.currentPage]);

  const handleScrollClick = () => {
    if (!scrolling) {
      setScrolling(true);

      const scrollProps = {
        smooth: "easeInOutQuad",
        duration: 750,
        containerId: SCROLL_ELEMENT_ID,
        ignoreCancelEvents: true
      };

      if (mobileMode) {
        animateScroll.scrollToTop(scrollProps);
      } else {
        animateScroll.scrollToBottom(scrollProps);
      }
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

  const createInputBar = useCallback(
    () => (
      <Box className={"gn-input-container"}>
        <Box sx={{ flex: 1 }}>
          {interaction.options && interaction.options.length ? (
            <DecisionBar options={interaction.options} mobileMode={mobileMode} />
          ) : (
            <ParserBar onEnterScroll={handleEnterScroll} mobileMode={mobileMode} />
          )}
        </Box>
        <div>
          {/* div is the flex item here so we can potentially put multiple things inside it. */}
          {renderFeedbackBox && <Feedback />}
        </div>
      </Box>
    ),
    [interaction.options, renderFeedbackBox]
  );

  return (
    <div className="gn-io-device">
      <Scene />
      {mobileMode && createInputBar()}
      <Box className="gn-content-area">
        <Box id={SCROLL_ELEMENT_ID} ref={scrollPaneRef} onScroll={debouncedScrollHandler} className="gn-content-scroll">
          {renderedMarkdown}
          <Element name="scrollBottom" />
          <Fade in={!atBottom && !autoScrolling && !mobileMode} timeout={1000}>
            <Box className="gn-overlay" />
          </Fade>
        </Box>
        <Fade
          in={!scrolling && ((!mobileMode && !atBottom) || (mobileMode && !atTop))}
          {...(!scrolling ? { timeout: 1000 } : {})}
        >
          <Fab
            size="small"
            color="primary"
            sx={{
              position: "absolute",
              right: "12px",
              bottom: mobileMode ? undefined : "0px",
              top: mobileMode ? "0px" : undefined
            }}
            aria-label={mobileMode ? "scroll up" : "scroll down"}
            onClick={handleScrollClick}
          >
            {mobileMode ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Fab>
        </Fade>
      </Box>
      {!mobileMode && createInputBar()}
    </div>
  );
};

const mapStateToProps = (state: StoreState) => {
  return {
    interaction: state.interaction,
    reverseInteraction: state.reverseInteraction
  };
};

export default connect(mapStateToProps)(IODevice);
