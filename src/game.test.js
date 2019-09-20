import Game from "./game";
import { store } from "./redux/store";

describe("Game class", () => {
  it("Defaults output to Loading", () => {
    const game = new Game("title");
    expect(store.getState().game.output).toBe("Loading..."); // Should really mock store here
  });

  it("Throws an error if trying to attach with no container", () => {
    const game = new Game("title");
    expect(game.attach).toThrow(Error);
  });
});
