import React, { KeyboardEvent, useCallback, useEffect } from "react";
import { Box } from "@mui/system";
import { connect, useDispatch, useSelector } from "react-redux";
import { revealScene } from "../../redux/gameActions";
import "./scene.css";

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
        <Box data-testid="scene-bar" className="gn-scene-bar">
          <Box sx={{ flex: 1 }} data-testid="scene-location">
            {location}
          </Box>
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
          className={`gn-scene-image ${image ? "gn-scene-image-present" : ""}`}
          style={{ backgroundImage: `url(${image})` }}
        ></div>
      )}
    </>
  );
};

const mapStateToProps = (state: StoreState) => {
  return {
    image: state.image,
    location: state.roomName || "",
    gameStarted: state.gameStarted
  };
};

export const Scene = connect(mapStateToProps)(SceneInner);
