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
type ContainerT = import("../game/items/container").Container;
type DoorT = import("../game/items/door").Door;
type KeyT = import("../game/items/door").Key;

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
  player?: ItemT;
  interaction: InteractionT;
  image?: string;
  lastChange: number;
  verbNames: {};
  // The names of items (including aliases) the player has encountered.
  itemNames: Set<string>;
  actionChainPromise?: Promise<string>;
  events: EventT[];
  keywords: Keywords;
  room?: null;
  recordChanges: false;
  rooms: {};
  allItemNames: Set<string>;
  items: {}; // Keyed by alias
  allItems: Set<ItemT>;
  optionGraphs: {};
  customState: CustomState;
  startingRoom: null;
  cyCommands: string[];
  cySay: null;
  cyChoose: null;
  eventTimeoutOverride: null;
  eventTurnsOverride: null;
  effects: EffectsT;
  autoActions: AutoActionT[];
  rollingLog: LogEntry[];
  playerInput?: string;
  game?: Game;
}

interface Dict {
  [key: string]: unknown;
}

interface KeywordsDict {
  [name: string]: VerbT;
}

interface ItemAliasDict {
  [alias: string]: Set<ItemT>;
}

interface CustomState {
  [key: string]: Serializable;
}

interface LogEntry {
  output: string[];
}

interface LogOptions {
  global?: boolean;
  element?: string;
}

interface ReduxAction {
  type: string;
  payload: any;
  keywords: VerbT[];
  keyword: string;
  room: RoomT;
  item: ItemT;
  optionGraph: OptionGraphT;
  snapshot: RevivedSnapshot;
  player: ItemT;
  force: boolean;
  propertyName: string;
  value: Serializable;
  startingRoom: RoomT;
  cySay: string;
  cyChoose: string;
  eventTimeoutOverride: boolean;
  eventTurnsOverride: boolean;
  autoAction: AutoActionT;
  playerTurn: boolean;
}

type GetState = () => StoreState;

/*********************/
/* SnapshotPersistor */
/*********************/

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

interface SerializedItem {
  [property: string]: Serialized;
  name: string;
  isItem: boolean;
}

interface SerializedText {
  isText: boolean;
  partial: boolean;
}

interface SerializedItemsDict {
  [name: string]: SerializedItem;
}

type Serializable = Serializable[] | string | Dict | boolean | number;
type Serialized = Serializable | SerializedItem | SerializedItem[] | SerializedText | SerializedText[];

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
  onSuccess?: ContextAction | ContextAction[];
  onFailure?: ContextAction | ContextAction[];
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

/********/
/* Item */
/********/

interface ItemConfig {
  [property: string]: unknown;
  name: string;
  description?: UnknownText;
  holdable?: boolean;
  size?: number;
  verbs?: VerbT | VerbT[];
  aliases?: string[];
  hidesItems?: ItemT[];
  properties?: ItemProperties;
}

interface ItemItemsDict {
  [name: string]: ItemT[];
}

interface ItemProperties {
  [key: string]: Serializable;
}

/********/
/* Room */
/********/

interface DirectionObject {
  room?: RoomT | SimpleAction;
  test?: () => boolean;
  onSuccess?: ContextAction | ContextAction[];
  failureText?: string;
  directionName?: DirectionName;
}

interface AdjacentRooms {
  [name: string]: DirectionObject;
}

type DirectionName = string | "north" | "south" | "east" | "west" | "up" | "down";
type Navigable = boolean | DoorT | (() => boolean);

/********/
/* Door */
/********/

interface DoorConfig {
  name: string;
  description: UnknownText;
  open: boolean;
  locked: boolean;
  openSuccessText: string;
  unlockSuccessText: string;
  aliases: string[];
  key: KeyT;
}

/*************/
/* Container */
/*************/

interface ContainerConfig {
  name: string;
  aliases: string[];
  closedDescription: UnknownText;
  openDescription: UnknownText;
  capacity: number;
  preposition: string;
  locked: boolean;
  open: boolean;
  holdable: boolean;
  size: number;
  closeable: boolean;
  verbs: VerbT[];
  lockable: boolean;
  key: string | KeyT;
}