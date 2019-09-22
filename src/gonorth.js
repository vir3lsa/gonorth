import Game from "./game/game";
import store from "./redux/store";

const createGame = (title, debugMode) => {
  return new Game(title, debugMode);
};

export default {
  createGame
};
