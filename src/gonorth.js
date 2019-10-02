import { initStore } from "./redux/store";
import Game from "./game/game";

initStore();

const createGame = (title, debugMode) => {
  return new Game(title, debugMode);
};

export default {
  createGame
};
