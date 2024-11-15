import { PagedText } from "@interactions/text";
import { preferPaged } from "./dynamicDescription";
import { unregisterStore } from "../redux/storeRegistry";
import gn from "../gonorth";

describe("dynamicDescription tests", () => {
  beforeEach(() => {
    unregisterStore();

    // Pretend we're in the browser
    gn.init({ title: "test", goToTitleScreen: false });
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
