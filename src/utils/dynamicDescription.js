import { Text, CyclicText, SequentialText } from "../game/text";

export const preferPaged = text => {
  if (
    typeof text === "string" ||
    (Array.isArray(text) && typeof text === "string")
  ) {
    return new SequentialText(text, true);
  }

  return text;
};

export const createDynamicText = text => {
  if (typeof text === "string" || text instanceof Text) {
    return () => text;
  } else if (Array.isArray(text) && typeof text[0] === "string") {
    const sequence = new CyclicText(text);
    return () => sequence;
  } else if (typeof text === "function") {
    return text;
  } else if (typeof text === "undefined") {
    return item => `There's nothing noteworthy about the ${item}.`;
  } else {
    throw Error("Text must be a string, string array, Text or a function");
  }
};
