import gonorth from "./gonorth";
import * as outputDependency from "./utils/consoleIO";

const title = "Space Auctioneer 2";

let outputSpy;
let game;

describe("goNORTH", () => {
  beforeEach(() => {
    outputSpy = jest.spyOn(outputDependency, "output");
    jest.spyOn(outputDependency, "showOptions").mockImplementation(x => x);
    game = gonorth.createGame(title, true);
  });

  afterEach(() => {
    outputSpy.mockRestore();
  });

  it("Creates a game with the given title", () => {
    const game = gonorth.createGame("The Witch's Grotto");
    expect(game.title).toBe("The Witch's Grotto");
  });

  it("Prints the game title", () => {
    let outputCalled = false;
    outputSpy.mockImplementation(text => {
      outputCalled = true;
      expect(text.includes("Space Auctioneer 2")).toBeTruthy();
    });

    game.play();
    expect(outputCalled).toBeTruthy();
  });
});
