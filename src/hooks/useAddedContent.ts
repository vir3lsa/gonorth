import { useMemo } from "react";

interface Props {
  older?: string;
  newer?: string;
  reverse?: boolean;
}

/**
 * Determines what has been added to the previous string, whether at the end or the start.
 * @param older The original string.
 * @param newer The new string.
 * @returns The added content, or the new string if it's a replacement.
 */
export default function useAddedContent({ older, newer }: Props) {
  return useMemo(() => {
    if (!older || !newer) {
      return newer;
    }

    if (newer.startsWith(older)) {
      // New content at the end.
      return newer.substring(older.length);
    } else if (newer.endsWith(older)) {
      // New content at the start.
      return newer.substring(0, newer.indexOf(older));
    }

    // Entirely new content.
    return newer;
  }, [older, newer]);
}