import { Interaction } from "./interaction";

describe("Interaction", () => {
  it("Turns a single page into an array", () => {
    const interaction = new Interaction("Hello");
    expect(Array.isArray(interaction.pages)).toBeTruthy();
  });
});
