/***********/
/* GoNorth */
/***********/

interface Config {
  storeName?: string;
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
  container?: Element;
  introActions: ActionChainT;
  schedules: ScheduleT[];
  help: OptionGraphT;
  hintGraph: OptionGraphT;
  hintNode: string;
  initialiser?: SimpleAction;
  component?: import("react").ReactElement;
}

type Initialiser = () => void;
type Intro = string | string[] | AnyText;

/***********/
/* Classes */
/***********/

type ItemT = import("../game/items/item").Item;
type RoomT = import("../game/items/room").Room;
type TextT = import("../game/interactions/text").Text;
type SequentialTextT = import("../game/interactions/text").SequentialText;
type CyclicTextT = import("../game/interactions/text").CyclicText;
type PagedTextT = import("../game/interactions/text").PagedText;
type RandomTextT = import("../game/interactions/text").RandomText;
type ConcatTextT = import("../game/interactions/text").ConcatText;
type ManagedTextT = import("../game/interactions/text").ManagedText;
type InteractionT = import("../game/interactions/interaction").Interaction;
type EventT = import("../game/events/event").Event;
type ScheduleT = import("../game/events/schedule").Schedule;
type EffectsT = import("../utils/effects").Effects;
type ActionChainT = import("../utils/actionChain").ActionChain;
type ActionClassT = import("../utils/actionChain").ActionClass;
type OptionGraphT = import("../game/interactions/optionGraph").OptionGraph;
type VerbT = import("../game/verbs/verb").Verb;
type AutoActionT = import("../game/input/autoAction").AutoAction;
type OptionT = import("../game/interactions/option").Option;
type SnaphotPersistorT = import("../redux/snapshotPersistor").SnapshotPersistor;

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
type TextFunction = (...args: any[]) => string | AnyText | TextFunction;
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
type PersistentVariable = string | number | boolean | Record<string, unknown> | PersistentVariable[];
type Snapshot = Record<string, any>;
type RevivedSnapshot = Record<string, any>;

interface JsonDict {
  [propertyName: string]: unknown;
}

/*********/
/* Redux */
/*********/

interface AllItemsDict {
  [key: string]: ItemT;
}

interface Keywords {
  [name: string]: VerbT;
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
  keywords: Keywords;
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

interface SnapshotPersistorConfig {
  version: number;
  name?: string;
  whitelist: string[];
  serializers: {
    [field: string]: (...args: any[]) => Serializable;
  };
  deserializers: {
    [key: string]: (value: Serializable) => unknown;
  };
}

interface Dict {
  [key: string]: unknown;
}

type GetState = () => StoreState;
type Serializable = string | string[] | Dict;

/***************/
/* ActionChain */
/***************/

interface Context {
  [key: string]: unknown;
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
type ActionBase =
  | ActionClassT
  | string
  | AnyText
  | InteractionT
  | ActionChainT
  | OptionGraphT
  | number
  | boolean
  | null
  | undefined;
type Action = ActionBase | Action[] | ActionFunction;
type ContextAction = ActionBase | ContextAction[] | ActionContextFunction;
type MaybeAction = Action | undefined | void;
type MaybePromise = Promise<any> | undefined;
type MaybeOptions = OptionT | OptionT[] | undefined;
type MaybeChainContext = ChainContext | undefined;
type ChainableFunction = (context?: ChainContext) => MaybePromise;
type PostScript = TextT | (() => string) | string;
type MaybePostScript = PostScript | undefined;
type Resolve = (value?: unknown) => void;

/*********/
/* Verbs */
/*********/

interface VerbDict {
  [name: string]: VerbT;
}

interface VerbNameDict {
  [name: string]: string;
}

interface VerbConfig {
  [property: string]: unknown;
  name: string;
  test?: Test;
  onSuccess?: Action | Action[];
  onFailure?: Action | Action[];
  aliases?: string[];
  isKeyword?: boolean;
  prepositional?: boolean;
  interrogative?: string;
  prepositionOptional?: boolean;
}

type TestFunction = (context: Context) => boolean;
type Test = boolean | TestFunction;

/**********/
/* Parser */
/**********/

type DisambiguationCallback = (item: ItemT) => string;

/*****************/
/* Option Graphs */
/*****************/

interface Node {
  id: string;
}

/********/
/* Misc */
/********/

type ItemOrRoom = ItemT | RoomT;
type ItemRoomOrString = ItemOrRoom | string;
type ItemOrString = ItemT | string;
