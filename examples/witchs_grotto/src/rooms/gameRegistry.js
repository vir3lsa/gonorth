import { Game } from "../../../../lib/gonorth";

let game;

export function getGame() {
  if (!game) {
    game = new Game("The Witch's Grotto", true);
  }

  return game;
}
