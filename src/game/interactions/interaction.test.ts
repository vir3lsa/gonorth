import { Interaction } from "./interaction";
import { unregisterStore } from "../../redux/storeRegistry";
import { initGame } from "../../gonorth";

beforeEach(() => {
  unregisterStore();

  // Pretend we're in the browser
  initGame("Jolly Capers", "", { debugMode: false });
});

describe("Interaction", () => {
  it("Keeps a single string as a string", () => {
    const interaction = new Interaction("Hello");
    expect(typeof interaction._text).toBe("string");
  });
});
