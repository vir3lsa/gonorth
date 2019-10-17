import { Interaction } from "./interaction";

describe("Interaction", () => {
  it("Keeps a single string as a string", () => {
    const interaction = new Interaction("Hello");
    expect(typeof interaction._text).toBe("string");
  });
});
