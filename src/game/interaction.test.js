import { Interaction } from "./interaction";
import { getStore } from "../redux/storeRegistry";
import { newGame } from "../redux/gameActions";
import { initStore } from "../redux/store";

initStore();
getStore().dispatch(newGame({}, true));

describe("Interaction", () => {
  it("Keeps a single string as a string", () => {
    const interaction = new Interaction("Hello");
    expect(typeof interaction._text).toBe("string");
  });
});
