/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import useAddedContent from "./useAddedContent";

describe("useAddedContent tests", () => {
  test("returns the difference between older and newer text", () => {
    const { result } = renderHook(useAddedContent, { initialProps: { older: "teddy", newer: "teddy bear" } });
    expect(result.current).toBe(" bear");
  });

  test("returns the newer string when it replaces the original", () => {
    const { result } = renderHook(useAddedContent, { initialProps: { older: "teddy", newer: "horse" } });
    expect(result.current).toBe("horse");
  });

  test("returns the same result on rerender", () => {
    const { result, rerender } = renderHook(useAddedContent, { initialProps: { older: "teddy", newer: "teddy bear" } });
    rerender({ older: "teddy", newer: "teddy bear" });
    expect(result.current).toBe(" bear");
  });

  test("returns new string if old string is undefined", () => {
    const { result } = renderHook(useAddedContent, { initialProps: { older: undefined, newer: "teddy bear" } });
    expect(result.current).toBe("teddy bear");
  });

  test("returns undefined if new string is undefined", () => {
    const { result } = renderHook(useAddedContent, { initialProps: { older: "teddy", newer: undefined } });
    expect(result.current).toBeUndefined();
  });
});