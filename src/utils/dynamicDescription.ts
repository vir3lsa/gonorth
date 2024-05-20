import { Text, CyclicText, PagedText, ManagedText } from "../game/interactions/text";

export const preferPaged = (text: UnknownText) => {
  if (typeof text === "string") {
    return new PagedText(text);
  } else if (Array.isArray(text)) {
    return new PagedText(...text);
  }

  return text;
};

export const createDynamicText = (text: UnknownText): TextFunction => {
  if (typeof text === "string" || text instanceof Text || text instanceof ManagedText) {
    return () => text;
  } else if (Array.isArray(text)) {
    const sequence = new CyclicText(...text);
    return () => sequence;
  } else if (typeof text === "function") {
    return text as TextFunction;
  } else if (typeof text === "undefined") {
    return (item: string) => `There's nothing noteworthy about the ${item}.`;
  } else {
    throw Error("Text must be a string, Text, ManagedText, function or an array of the above.");
  }
};
