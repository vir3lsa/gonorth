import Game from "./game";
import { initStore } from "../redux/store";
import { getStore } from "../redux/storeRegistry";

initStore();
jest.mock("../utils/consoleIO");

describe("Game class", () => {
  it("Defaults output to Loading", () => {
    new Game("title");
    expect(getStore().getState().game.interaction.currentPage).toBe(
      "Loading..."
    );
  });

  it("Throws an error if trying to attach with no container", () => {
    const game = new Game("title");
    expect(game.attach).toThrow(Error);
  });
});
