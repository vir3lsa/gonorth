import Game from "./game/game";

const createGame = (title, debugMode) => {
  return new Game(title, debugMode);
};

export default {
  createGame
};
