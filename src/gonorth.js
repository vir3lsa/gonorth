import Game from "./game";
import { output } from "./output";

const createGame = title => {
  return new Game(title);
};

const playGame = game => {
  if (!game) {
    throw Error("No game to play");
  }

  output(formatTitle(game.title || "Untitled"));
};

const attach = container => {
  if (!container) {
    throw Error("No container provided");
  }

  const component = <div>Game output goes here</div>; // placeholder
  ReactDOM.render(component, container);
};

const formatTitle = title =>
  [...title]
    .map((c, i) => {
      return `${c}${i === title.length - 1 ? "" : " "}`;
    })
    .join("");

export default {
  createGame,
  playGame,
  attach
};
