/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import useAddedContent from "./useAddedContent";

describe("useAddedContent tests", () => {
  const runTest = (older?: string, newer?: string) => {
    const { result } = renderHook(useAddedContent, { initialProps: { older, newer } });
    return result.current;
  }

  test("returns the difference between older and newer text", () => {
    const result = runTest("teddy", "teddy bear");
    expect(result).toBe(" bear");
  });

  test("returns the newer string when it replaces the original", () => {
    const result = runTest("teddy", "horse");
    expect(result).toBe("horse");
  });

  test("returns the same result on rerender", () => {
    const { result, rerender } = renderHook(useAddedContent, { initialProps: { older: "teddy", newer: "teddy bear" } });
    rerender({ older: "teddy", newer: "teddy bear" });
    expect(result.current).toBe(" bear");
  });

  test("returns new string if old string is undefined", () => {
    const result = runTest(undefined, "teddy bear");
    expect(result).toBe("teddy bear");
  });

  test("returns undefined if new string is undefined", () => {
    const result = runTest("teddy", undefined);
    expect(result).toBeUndefined();
  });

  test("returns an empty string if nothing has changed", () => {
    const result = runTest("teddy", "teddy");
    expect(result).toBe("");
  });

  test("returns the difference when text is added to the start", () => {
    const result = runTest("teddy", "bear teddy");
    expect(result).toBe("bear ");
  });
});