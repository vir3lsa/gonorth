interface AllItemsDict {
  [key: string]: import("items/item").Item;
}

type AlteredProperties = Set<string>;

interface JsonDict {
  [propertyName: string]: unknown;
}

interface ManagedTextPhase {
  text: import("interactions/text").Text;
  times: number;
}

interface SerializedItem {
  // TODO
}

interface SerializedManagedTextPhase {
  text: SerializedText;
  times: number;
}

interface SerializedText {
  type: string;
  texts: string[];
  phases?: SerializedManagedTextPhase[];
}

type TextCallback = () => void;

type TextPart = string | ((...args: unknown[]) => string) | import("interactions/text").Text;
