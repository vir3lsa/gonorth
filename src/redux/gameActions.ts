import { AnyAction, Dispatch } from "redux";
import * as type from "./gameActionTypes";
import { output, getOptionsString } from "../utils/consoleIO";
import { Parser } from "../game/input/parser";
import { AppendInput, Append } from "../game/interactions/interaction";

const selectDebugMode = (state: StoreState) => state.debugMode;
const selectPlayerInput = (state: StoreState) => state.playerInput;

export const newGame = (game: Game, debugMode: boolean = false) => ({
  type: type.NEW_GAME,
  payload: { game, debugMode }
});

export const changeInteraction =
  (
    interaction: InteractionT
  ): unknown => // TODO
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const debugMode = selectDebugMode(state);

    if (!(interaction instanceof AppendInput)) {
      const currentOutput = interaction.currentPage;
      let currentOptions = interaction.options;

      if (!currentOptions && interaction instanceof Append) {
        // Current options are copied onto new interaction
        currentOptions = state.interaction.options;
      }

      let newLog = "";

      if (currentOutput) {
        newLog += currentOutput;

        if (debugMode) {
          output(currentOutput);
        }
      }

      if (currentOptions && currentOptions.length) {
        const optionsString = getOptionsString(currentOptions);
        newLog += newLog.length ? `\n\n${optionsString}` : optionsString;

        if (debugMode) {
          output(optionsString);
        }
      }

      if (state.game?.config.recordLogs) {
        dispatch({
          type: type.ADD_LOG_ENTRY,
          payload: newLog,
          playerTurn: false
        });
      }
    }

    dispatch({
      type: type.CHANGE_INTERACTION,
      payload: interaction
    });

    return interaction.promise;
  };

export const changeImage = (image?: string) => ({
  type: type.CHANGE_IMAGE,
  payload: image
});

export const receivePlayerInput =
  (input: string): unknown =>
  (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: type.RECEIVE_INPUT,
      payload: input
    });

    dispatch({
      type: type.CY_SAY,
      cySay: input
    });

    const state = getState();

    if (state.game?.config.recordLogs) {
      dispatch({
        type: type.ADD_LOG_ENTRY,
        payload: input,
        playerTurn: true
      });
    }

    const debugMode = selectDebugMode(state);
    const currentInput = selectPlayerInput(state);

    if (currentInput && currentInput.length) {
      if (debugMode) {
        output(`Received input: ${currentInput}`);
      }

      // Respond to input and return Promise that resolves when actions are complete
      return new Parser(currentInput).parse();
    }
  };

export const nextTurn = () => ({
  type: type.NEXT_TURN
});

export const verbCreated = (names: VerbNameDict) => ({
  type: type.VERB_CREATED,
  payload: names
});

export const itemsRevealed = (itemNames: string[]) => ({
  type: type.ITEMS_REVEALED,
  payload: itemNames
});

export const chainStarted = (promise: Promise<unknown>) => ({
  type: type.CHAIN_STARTED,
  payload: promise
});

export const chainEnded = (promise: Promise<unknown>) => ({
  type: type.CHAIN_ENDED,
  payload: promise
});

export const addEvent = (event: EventT) => ({
  type: type.ADD_EVENT,
  payload: event
});

export const addKeywords = (keywords: KeywordsDict) => ({
  type: type.ADD_KEYWORDS,
  keywords
});

export const removeKeywords = (keyword: string) => ({
  type: type.REMOVE_KEYWORDS,
  keyword
});

export const addRoom = (room: RoomT) => ({
  type: type.ADD_ROOM,
  room
});

export const addItem = (item: ItemT) => ({
  type: type.ADD_ITEM,
  item
});

export const addOptionGraph = (optionGraph: OptionGraphT) => ({
  type: type.ADD_OPTION_GRAPH,
  optionGraph
});

export const loadSnapshot = (snapshot: RevivedSnapshot) => ({
  type: type.LOAD_SNAPSHOT,
  snapshot
});

export const changeRoom = (room: RoomT) => ({
  type: type.CHANGE_ROOM,
  room
});

export const recordChanges = () => ({
  type: type.RECORD_CHANGES
});

export const setPlayer = (player: ItemT) => ({
  type: type.SET_PLAYER,
  player
});

export const addValue = (propertyName: string, value: PersistentVariable, force: boolean) => ({
  type: type.ADD_VALUE,
  propertyName,
  value,
  force
});

export const updateValue = (propertyName: string, value: PersistentVariable) => ({
  type: type.UPDATE_VALUE,
  propertyName,
  value
});

export const forgetValue = (propertyName: string) => ({
  type: type.FORGET_VALUE,
  propertyName
});

export const cleanState = () => ({
  type: type.CLEAN_STATE
});

export const setStartRoom = (startingRoom: RoomT) => ({
  type: type.SET_STARTING_ROOM,
  startingRoom
});

export const cyChoose =
  (choice: string): unknown =>
  (dispatch: Dispatch, getState: GetState) => {
    if (getState().game?.config.recordLogs) {
      dispatch({
        type: type.ADD_LOG_ENTRY,
        payload: `[${choice}]`,
        playerTurn: true
      });
    }

    dispatch({
      type: type.CY_CHOOSE,
      cyChoose: choice
    });
  };

export const cyRecord = () => ({
  type: type.CY_RECORD
});

export const overrideEventTimeout = (eventTimeoutOverride?: number, eventTurnsOverride?: number) => ({
  type: type.OVERRIDE_EVENT_TIMEOUT,
  eventTimeoutOverride,
  eventTurnsOverride
});

export const addAutoInput = (autoAction: AutoActionT) => ({
  type: type.ADD_AUTO_ACTION,
  autoAction
});

export const gameStarted = (gameStarted: boolean = true) => ({
  type: type.GAME_STARTED,
  gameStarted
});
