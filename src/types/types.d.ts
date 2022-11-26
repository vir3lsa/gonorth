/********/
/* Text */
/********/

interface ManagedTextPhase {
  text: import("../game/interactions/text").Text;
  times: number;
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

type AnyText = import("../game/interactions/text").Text | import("../game/interactions/text").ManagedText;
type TextFunction = (...args: unknown[]) => string | AnyText | TextFunction;
type TextPart = string | TextFunction | AnyText;
type UnknownText = string | string[] | AnyText | TextFunction;

/*************/
/* Functions */
/*************/

type Consumer = (value?: unknown) => void;
type SimpleAction = () => void;

/*************************/
/* Persistent Properties */
/*************************/

type AlteredProperties = Set<string>;
type PersistentVariable = string | number | boolean | Record<string, unknown>;

interface JsonDict {
  [propertyName: string]: unknown;
}

/*********/
/* Redux */
/*********/

interface AllItemsDict {
  [key: string]: import("../game/items/item").Item;
}
