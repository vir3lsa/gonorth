import * as store from "../redux/store"; // Seem to need this otherwise get errors!
import Interaction from "./interaction";

describe("Interaction", () => {
  it("Turns a single page into an array", () => {
    const interaction = new Interaction("Hello");
    expect(Array.isArray(interaction.pages)).toBeTruthy();
  });
});
