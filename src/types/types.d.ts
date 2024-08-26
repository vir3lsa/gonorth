/***********/
/* GoNorth */
/***********/

interface Config {
  storeName?: string;
  debugMode?: boolean;
  skipReactionTimes?: boolean;
  renderFeedbackBox?: boolean;
  recordLogs?: boolean;
  referToPlayerAs?: string;
  feedbackHandler?: (feedback: string, name: string, logs: LogEntry[]) => void;
  randomSeed?: string;
  skipPersistence?: boolean;
  startScreenImage?: string;
  hideTitle?: boolean;
}

interface Game {
  title: string;
  author: string;
  config: Config;
  container?: Element;
  introActions: ActionChainT;
  schedules: (ScheduleT | RouteT)[];
  help: OptionGraphT;
  hintGraph: OptionGraphT;
  initialiser?: SimpleAction;
  component?: import("react").ReactElement;
  version?: string;
}

type Initialiser = () => void;
type Intro = string | string[] | AnyText;

/***********/
/* Classes */
/***********/

type ItemT = import("../game/items/item").Item;
type ItemBuilderT = import("../game/items/item").Builder;
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
type RouteT = import("../game/events/route").Route;
type EffectsT = import("../utils/effects").Effects;
type EffectT = import("../utils/effects").Effect;
type EffectBuilderT = import("../utils/effects").EffectBuilder;
type VerbRelation = import("../utils/effects").VerbRelation;
type ActionChainT = import("../utils/actionChain").ActionChain;
type ActionClassT = import("../utils/actionChain").ActionClass;
type OptionGraphT = import("../game/interactions/optionGraph").OptionGraph;
type VerbT = import("../game/verbs/verb").Verb;
type VerbBuilderT = import("../game/verbs/verb").Builder;
type AutoActionT = import("../game/input/autoAction").AutoAction;
type OptionT = import("../game/interactions/option").Option;
type SnaphotPersistorT = import("../redux/snapshotPersistor").SnapshotPersistor;
type ContainerT = import("../game/items/container").Container;
type DoorT = import("../game/items/door").Door;
type KeyT = import("../game/items/door").Key;
type NpcT = import("../game/items/npc").Npc;

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

interface RoomDict {
  [name: string]: RoomT;
}

interface OptionGraphDict {
  [name: string]: OptionGraphT;
}

interface SerializableOptionGraph {
  currentNode?: string;
}

interface SerializableOptionGraphDict {
  [name: string]: SerializableOptionGraph;
}

interface StoreState {
  turn: number;
  debugMode: boolean;
  player?: ItemT;
  interaction: InteractionT;
  image?: string;
  lastChange: number;
  verbNames: VerbNameDict;
  // The names of items (including aliases) the player has encountered.
  itemNames: Set<string>;
  actionChainPromise?: Promise<string>;
  events: EventT[];
  keywords: Keywords;
  room?: RoomT;
  recordChanges: false;
  rooms: RoomDict;
  allItemNames: Set<string>;
  items: ItemAliasDict; // Keyed by alias
  allItems: Set<ItemT>;
  optionGraphs: OptionGraphDict;
  customState: CustomState;
  startingRoom?: RoomT;
  cyCommands: string[];
  cySay?: string;
  cyChoose?: string;
  eventTimeoutOverride?: number;
  eventTurnsOverride?: number;
  effects: EffectsT;
  autoActions: AutoActionT[];
  rollingLog: LogEntry[];
  playerInput?: string;
  game?: Game;
  gameStarted: boolean;
  sceneRevealed: boolean;
  feedbackOpen: boolean;
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
  input: string;
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
  gameStarted: boolean;
  sceneRevealed: boolean;
  feedbackOpen: boolean;
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
  alias?: string;
}

interface ActionChainHelpers {
  fail?: () => boolean;
  abort?: () => boolean;
}

type ChainContext = Partial<Context> & ActionChainHelpers;
type DefiniteContext = Context & ActionChainHelpers;
type AnyContext = Context | ActionChainHelpers;

interface EffectsDict {
  [primaryKey: string]: {
    [secondaryKey: string]: {
      [verbName: string]: EffectT;
    };
  };
}

interface EffectConfig {
  primaryItem?: ItemOrString;
  secondaryItem: ItemOrString;
  verbName: string;
  successful: boolean;
  verbRelation: VerbRelation;
  actions: ContextAction[];
}

type ActionFunction = (context: ChainContext) => MaybeAction;
type ActionContextFunction = (context: DefiniteContext) => MaybeContextAction;
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
  | undefined
  | Promise<any>;
type Action = ActionBase | Action[] | ActionFunction;
type ContextAction = ActionBase | ContextAction[] | ActionContextFunction;
type MaybeContextAction = ContextAction | undefined | void;
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
  tests?: (Test | SmartTest)[];
  onSuccess?: ContextAction | ContextAction[];
  onFailure?: ContextAction | ContextAction[];
  aliases?: string[];
  isKeyword?: boolean;
  prepositional?: boolean;
  interrogative?: string;
  prepositionOptional?: boolean;
  description?: string;
  expectedArgs?: string[];
}

type TestFunction = (context: Context) => boolean;
type Test = boolean | TestFunction;

// A verb test that includes its own failure response.
interface SmartTest {
  test: TestFunction;
  onFailure: Action;
}

/**********/
/* Parser */
/**********/

type DisambiguationCallback = (item: ItemT) => string | Promise<unknown>;

interface ItemDetails {
  alias: string;
  itemsWithName: ItemT[];
  itemIndex: number;
}

/*****************/
/* Option Graphs */
/*****************/

type Condition = () => boolean;
type InventoryAction = (item: ItemT) => string;
type SomeGraphOption = string | GraphOption | Action;

interface GraphOption {
  id?: string;
  condition?: Condition;
  node?: string;
  skipNodeActions?: boolean;
  exit?: boolean;
  room?: RoomT;
  actions?: Action;
  inventoryAction?: InventoryAction;
}

interface GraphOptions {
  [label: string]: SomeGraphOption;
}

type UnknownOptions = GraphOptions | (() => GraphOptions);

interface GraphNode {
  id: string;
  options?: UnknownOptions;
  visited?: boolean;
  actions?: Action;
  allowRepeats?: boolean;
  noEndTurn?: boolean;
}

/********/
/* Misc */
/********/

type ItemOrRoom = ItemT | RoomT;
type ItemRoomOrString = ItemOrRoom | string;
type ItemOrString = ItemT | string;
type MaybeItemOrString = ItemOrString | undefined;
type OptionAction = () => Promise<unknown>;

/********/
/* Item */
/********/

interface VerbCustomisations {
  [verbName: string]: (verb: VerbT) => void;
}

interface ItemConfig {
  [property: string]: unknown;
  name: string;
  description?: UnknownText;
  holdable?: boolean;
  size?: number;
  verbs?: VerbT | VerbBuilderT | (VerbT | VerbBuilderT)[];
  aliases?: string[];
  omitAliases?: string[];
  items?: (ItemT | ItemBuilderT)[];
  hidesItems?: (ItemT | ItemBuilderT)[];
  properties?: ItemProperties;
  verbCustomisations?: VerbCustomisations;
  producesSingular?: ItemT;
  plural?: boolean;
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

interface RoomConfig {
  checkpoint?: boolean;
  verbs?: VerbT[];
  image?: string;
}

interface DirectionObject {
  room?: RoomT | SimpleAction;
  test?: () => boolean;
  onSuccess?: ContextAction | ContextAction[];
  failureText?: string;
  directionName?: DirectionName;
  door?: DoorT;
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
  [property: string]: unknown;
  name: string;
  description: UnknownText;
  open: boolean;
  locked: boolean;
  alwaysOpen?: boolean;
  transparent?: boolean;
  onLocked: Action;
  onNeedsKey: Action;
  openSuccessText: Action;
  onCloseSuccess: Action;
  unlockSuccessText: Action;
  aliases: string[];
  key: KeyT;
  traversals?: Traversal[];
}

interface TraversalConfig {
  aliases: string[];
  origin?: string;
  activationCondition?: Test;
  tests: SmartTest[];
  doorOpenTest?: SmartTest;
  onSuccess: Action[];
  onFailure: Action[];
  onPeekSuccess?: Action[];
  destination?: string;
}

interface Traversal {
  aliases: string[];
  id: number;
  destination: string;
  activationCondition: TestFunction;
  tests: SmartTest[];
  doorOpenTest?: SmartTest;
  onSuccess: Action[];
  onFailure: Action[];
  onPeekSuccess: Action[];
}

/*************/
/* Container */
/*************/

interface ContainerConfig {
  [property: string]: unknown;
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

/**************/
/* AutoAction */
/**************/

type Input = (context: Context) => string;

/*********/
/* Event */
/*********/

type TimeoutType = "TIMEOUT_MILLIS" | "TIMEOUT_TURNS";
