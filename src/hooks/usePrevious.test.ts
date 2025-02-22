/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import usePrevious from "./usePrevious";

describe("usePrevious tests", () => {
  test("records initial value", () => {
    const { result } = renderHook(usePrevious, { initialProps: "teddy"});
    expect(result.current.previous).toBeUndefined();
    expect(result.current.previousDifferent).toBeUndefined();
  });

  test("maintains initial value if props don't change", () => {
    const { result, rerender } = renderHook(usePrevious, { initialProps: "teddy"});
    rerender("teddy");
    expect(result.current.previous).toBe("teddy");
    expect(result.current.previousDifferent).toBe(undefined);
  })

  test("records previous value", () => {
    const { result, rerender } = renderHook(usePrevious, { initialProps: "teddy"});
    rerender("bear");
    expect(result.current.previous).toBe("teddy");
    expect(result.current.previousDifferent).toBe("teddy");
  });

  test("maintains previous different value when props don't change", () => {
    const { result, rerender } = renderHook(usePrevious, { initialProps: "teddy"});
    rerender("bear");
    rerender("bear");
    expect(result.current.previous).toBe("bear");
    expect(result.current.previousDifferent).toBe("teddy");
  });

  test("continues to work with multiple props changes", () => {
    const { result, rerender } = renderHook(usePrevious, { initialProps: "teddy"});
    rerender("bear");
    rerender("horse");
    expect(result.current.previous).toBe("bear");
    expect(result.current.previousDifferent).toBe("bear");
  });

  test("continues to work with even more props changes", () => {
    const { result, rerender } = renderHook(usePrevious, { initialProps: "teddy"});
    rerender("bear");
    rerender("horse");
    rerender("horse");
    rerender("horse");
    expect(result.current.previous).toBe("horse");
    expect(result.current.previousDifferent).toBe("bear");
  });
});