import gonorth from "./gonorth";

const title = "Space Auctioneer 2";
let game;

jest.mock("./utils/consoleIO");
const consoleIO = require("./utils/consoleIO");

describe("goNORTH", () => {
  beforeEach(() => {
    consoleIO.output = jest.fn();
    consoleIO.showOptions = jest.fn();
    game = gonorth.createGame(title, true);
  });

  it("Creates a game with the given title", () => {
    const game = gonorth.createGame("The Witch's Grotto");
    expect(game.title).toBe("The Witch's Grotto");
  });

  it("Prints the game title", () => {
    game.play();
    expect(consoleIO.output.mock.calls[0][0]).toBe("# Space Auctioneer 2");
  });
});
