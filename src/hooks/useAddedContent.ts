import { useMemo } from "react";

interface Props {
  older?: string;
  newer?: string;
}

/**
 * Determines what has been added to the previous string.
 * @param older The original string.
 * @param newer The new string.
 * @returns The added content, or the new string if it's a replacement.
 */
export default function useAddedContent({ older, newer }: Props) {
  return useMemo(() => {
    if (!older || !newer) {
      return newer;
    }

    return newer.startsWith(older) ? newer.substring(older.length) : newer
  }, [older, newer]);
}