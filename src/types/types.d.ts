/***********/
/* Classes */
/***********/

type ItemT = import("../game/items/item").Item;
type RoomT = import("../game/items/room").Room;
type TextT = import("../game/interactions/text").Text;
type ManagedTextT = import("../game/interactions/text").ManagedText;
type InteractionT = import("../game/interactions/interaction").Interaction;
type EventT = import("../game/events/event").Event;
type EffectsT = import("../utils/effects").Effects;
type ActionChainT = import("../utils/actionChain").ActionChain;
type ActionClassT = import("../utils/actionChain").ActionClass;
type OptionGraphT = import("../game/interactions/optionGraph").OptionGraph;
type VerbT = import("../game/verbs/verb").Verb;
type AutoActionT = import("../game/input/autoAction").AutoAction;
type OptionT = import("../game/interactions/option").Option;

/********/
/* Text */
/********/

interface ManagedTextPhase {
  text: TextT;
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

type AnyText = TextT | ManagedTextT;
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
type Snapshot = Record<string, unknown>;

interface JsonDict {
  [propertyName: string]: unknown;
}

/*********/
/* Redux */
/*********/

interface AllItemsDict {
  [key: string]: ItemT;
}

interface StoreState {
  turn: number;
  debugMode: boolean;
  player: ItemT;
  interaction: InteractionT;
  image: string;
  lastChange: Date;
  verbNames: {};
  // The names of items (including aliases) the player has encountered.
  itemNames: Set<string>;
  actionChainPromise: Promise<string>;
  events: EventT[];
  keywords: {};
  room: null;
  recordChanges: false;
  rooms: {};
  allItemNames: Set<string>;
  items: {}; // Keyed by alias
  allItems: Set<ItemT>;
  optionGraphs: {};
  customState: {};
  startingRoom: null;
  cyCommands: [];
  cySay: null;
  cyChoose: null;
  eventTimeoutOverride: null;
  eventTurnsOverride: null;
  effects: EffectsT;
  autoActions: [];
  rollingLog: [];
  playerInput?: string;
  game?: Game;
}

interface Config {
  storeName: string;
  debugMode?: boolean;
  skipReactionTimes?: boolean;
  renderFeedbackBox?: boolean;
  recordLogs?: boolean;
  feedbackHandler?: (feedback: string, name: string, logs: string[]) => void;
  randomSeed?: string;
}

interface Game {
  title: string;
  author: string;
  config: Config;
  container: null;
  introActions: ActionChainT;
  schedules: [];
  help: OptionGraphT;
  hintGraph: OptionGraphT;
  hintNode: string;
  initialiser: SimpleAction;
}

type GetState = () => StoreState;

/*********/
/* Verbs */
/*********/

interface Context {
  verb: VerbT;
  item: ItemT;
  other?: ItemT;
}

interface ActionChainHelpers {
  fail?: () => boolean;
}

type ChainContext = Partial<Context> & ActionChainHelpers;
type DefiniteContext = Context & ActionChainHelpers;
type AnyContext = Context | ActionChainHelpers;

interface EffectsDict {
  [primaryKey: string]: {
    [secondaryKey: string]: {
      [verbName: string]: {
        successful: boolean;
        continueVerb: boolean;
        effects: ActionChainT;
      };
    };
  };
}

type ActionFunction = (context: ChainContext) => MaybeAction;
type ActionContextFunction = (context: DefiniteContext) => MaybeAction;
type ActionBase = ActionClassT | string | AnyText | InteractionT | ActionChainT | OptionGraphT;
type Action = ActionBase | Action[] | ActionFunction;
type ContextAction = ActionBase | ContextAction[] | ActionContextFunction;
type MaybeAction = Action | undefined;
type MaybePromise = Promise<any> | undefined;
type MaybeOptions = OptionT[] | undefined;
type MaybeChainContext = ChainContext | undefined;
type ChainableFunction = (context?: ChainContext) => MaybePromise;
type PostScript = TextT | (() => string) | string;
type MaybePostScript = PostScript | undefined;
type Resolve = (value?: unknown) => void;

/********/
/* Misc */
/********/

type ItemOrRoom = ItemT | RoomT;
type ItemRoomOrString = ItemOrRoom | string;
type ItemOrString = ItemT | string;
