import { store } from "../redux/store";

const selectRoom = () => store.getState().game.game.room;

const keywords = {
  north: () => selectRoom().go("north"),
  south: () => selectRoom().go("south"),
  east: () => selectRoom().go("east"),
  west: () => selectRoom().go("west")
};

export const parsePlayerInput = input => {
  const tokens = input
    .trim()
    .toLowerCase()
    .split(/\s+/);
  // TODO First look for custom verbs

  // Next, look for keywords
  const keyword = keywords[tokens[0]];
  if (keyword) {
    keyword();
  }
};
