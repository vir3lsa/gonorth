import Game from "./game";

describe("Game class", () => {
  it("Defaults output to Loading", () => {
    const game = new Game("title");
    expect(game.output).toBe("Loading...");
  });

  it("Throws an error if trying to attach with no container", () => {
    const game = new Game("title");
    expect(game.attach).toThrow(Error);
  });
});
