import { useEffect, useRef } from "react";

/**
 * Records the previous value and the previous different value.
 * @param value the current value.
 * @returns the previous value.
 */
export default function usePrevious<T>(value: T) {
  const prevRef = useRef<T>();
  const diffRef = useRef<T>();

  useEffect(() => {
    diffRef.current = prevRef.current;
    prevRef.current = value;
  }, [value]);

  const previous = prevRef.current;
  const previousDifferent = value === previous ? diffRef.current : previous;

  return { previous, previousDifferent };
}