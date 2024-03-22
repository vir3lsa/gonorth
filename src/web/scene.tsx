import React, { KeyboardEvent, useCallback, useEffect } from "react";
import { Box } from "@mui/system";
import { connect, useDispatch, useSelector } from "react-redux";
import { revealScene } from "../redux/gameActions";

interface Props {
  image?: string;
  location: string;
  gameStarted: boolean;
}

const ENTER = "Enter";
const SPACE = " ";

const SceneInner: React.FC<Props> = ({ location, image, gameStarted }) => {
  const sceneRevealed = useSelector((state: StoreState) => state.sceneRevealed);
  const dispatch = useDispatch();
  const showScene = useCallback((reveal: boolean) => dispatch(revealScene(reveal)), []);

  const handleKeyUp = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === ENTER || event.key === SPACE) {
      showScene(!sceneRevealed);
    }
  };

  // Show the scene when we change location etc.
  useEffect(() => {
    showScene(true);
  }, [location, image, gameStarted]);

  return (
    <>
      {gameStarted && (
        <Box
          data-testid="scene-bar"
          sx={{
            marginBottom: "8px",
            fontSize: "1em",
            color: "#222",
            background: "#eed",
            opacity: 0.8,
            padding: "1px 4px",
            borderRadius: "3px",
            fontWeight: 600,
            display: "flex"
          }}
        >
          <Box sx={{ flex: 1 }}>{location}</Box>
          {image && (
            <a
              style={{ textDecoration: "underline", cursor: "pointer" }}
              onClick={() => showScene(!sceneRevealed)}
              onKeyUp={handleKeyUp}
              data-testid="image-toggle"
              role="button"
              tabIndex={1}
            >
              {sceneRevealed ? "Hide Scene" : "Show Scene"}
            </a>
          )}
        </Box>
      )}
      {image && sceneRevealed && (
        <div
          data-testid="scene-image"
          style={{
            backgroundImage: `url(${image})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            height: image ? "49vw" : 0,
            maxHeight: "50%",
            marginBottom: image ? "8px" : 0,
            borderRadius: "3px"
          }}
        ></div>
      )}
    </>
  );
};

const mapStateToProps = (state: StoreState) => {
  return {
    image: state.image,
    location: state.room?.name || "", // TODO Need a separate state var for this.
    gameStarted: state.gameStarted
  };
};

export const Scene = connect(mapStateToProps)(SceneInner);
