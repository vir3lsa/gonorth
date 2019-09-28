import Game from "./game";
import { store } from "../redux/store";
import * as outputDependency from "../utils/consoleIO";

jest.mock("../utils/consoleIO");

describe("Game class", () => {
  it("Defaults output to Loading", () => {
    new Game("title");
    expect(store.getState().game.interaction.currentPage).toBe("Loading...");
  });

  it("Throws an error if trying to attach with no container", () => {
    const game = new Game("title");
    expect(game.attach).toThrow(Error);
  });
});
