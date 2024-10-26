import { PagedText } from "@interactions/text";
import { preferPaged } from "./dynamicDescription";
import { getStore, unregisterStore } from "../redux/storeRegistry";
import { initGame } from "../gonorth";
import { newGame } from "../redux/gameActions";

let game;

describe("dynamicDescription tests", () => {
  beforeEach(() => {
    unregisterStore();

    // Pretend we're in the browser
    game = initGame("Jolly Capers", "", { debugMode: false });
    getStore().dispatch(newGame(game, false));
  });

  it("preferPaged creates PagedText from input string", () => {
    const result = preferPaged("testing");
    expect(result).toBeInstanceOf(PagedText);
    expect(result.next()).toBe("testing");
  });

  it("preferPaged creates PagedText from input function", () => {
    const result = preferPaged(() => "testing");
    expect(result).toBeInstanceOf(PagedText);
    expect(result.next()).toBe("testing");
  });

  it("preferPaged creates PagedText from input string array", () => {
    const result = preferPaged(["test1", "test2"]);
    expect(result).toBeInstanceOf(PagedText);
    expect(result.next()).toBe("test1");
    expect(result.next()).toBe("test2");
  });
});
