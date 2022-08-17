import * as type from "../gameActionTypes";
import {
  Interaction,
  Append,
  AppendInput
} from "../../game/interactions/interaction";
import { Effects } from "../../utils/effects";

const outputSnippetLength = 30;

export const initialState = {
  turn: 1,
  debugMode: false,
  player: null,
  interaction: new Interaction("Loading..."),
  image: null,
  lastChange: Date.now(),
  verbNames: {},
  // The names of items (including aliases) the player has encountered.
  itemNames: new Set(),
  actionChainPromise: null,
  events: [],
  keywords: {},
  room: null,
  recordChanges: false,
  rooms: {},
  allItemNames: new Set(),
  items: {}, // Keyed by alias
  allItems: new Set(),
  optionGraphs: {},
  customState: {},
  startingRoom: null,
  cyCommands: [],
  cySay: null,
  cyChoose: null,
  eventTimeoutOverride: null,
  eventTurnsOverride: null,
  effects: new Effects(),
  autoActions: []
};

export default function (state = initialState, action) {
  switch (action.type) {
    case type.NEW_GAME:
      return { ...state, ...action.payload };
    case type.CHANGE_INTERACTION:
      const interaction = action.payload;
      const updatedState = updateCyCommands(state, interaction.currentPage, !(interaction instanceof Append));

      if (interaction instanceof Append && state.interaction.currentPage) {
        interaction.currentPage =
          state.interaction.currentPage + (interaction.currentPage ? "\n\n" + interaction.currentPage : "");

        if (!interaction.options && interaction.renderOptions && !state.interaction.nextButtonRendered) {
          // Copy concrete options (not 'Next') from previous interaction
          // Required e.g. by Events, which append text at indeterminate times
          interaction.options = state.interaction.options;
        }

        if (typeof interaction.renderNextButton === "undefined" && !(interaction instanceof AppendInput)) {
          interaction.renderNextButton = state.interaction.renderNextButton;
        }
      }

      return {
        ...updatedState,
        interaction,
        lastChange: Date.now()
      };
    case type.CHANGE_IMAGE:
      return { ...state, image: action.payload };
    case type.RECEIVE_INPUT:
      return { ...state, playerInput: action.payload };
    case type.NEXT_TURN:
      return { ...state, turn: state.turn + 1 };
    case type.VERB_CREATED:
      const verbNames = { ...state.verbNames, ...action.payload };
      return { ...state, verbNames };
    case type.ITEMS_REVEALED:
      return {
        ...state,
        itemNames: new Set([...state.itemNames, ...action.payload.map((i) => i.toLowerCase())])
      };
    case type.CHAIN_STARTED:
      return {
        ...state,
        actionChainPromise: state.actionChainPromise || action.payload
      };
    case type.CHAIN_ENDED:
      const actionChainPromise = action.payload === state.actionChainPromise ? null : state.actionChainPromise;
      return { ...state, actionChainPromise };
    case type.ADD_EVENT:
      const events = [...state.events, action.payload];
      return { ...state, events };
    case type.ADD_KEYWORDS:
      return { ...state, keywords: { ...state.keywords, ...action.keywords } };
    case type.REMOVE_KEYWORDS:
      const keyword = state.keywords[action.keyword];
      const keywords = { ...state.keywords };
      keyword.aliases.forEach((alias) => delete keywords[alias]);
      delete keywords[keyword.name];
      return { ...state, keywords };
    case type.ADD_ROOM:
      return { ...state, rooms: { ...state.rooms, [action.room.name.toLowerCase()]: action.room } };
    case type.ADD_ITEM:
      let newState = { ...state, allItemNames: new Set([...state.allItemNames, action.item.name]) };
      const newAllItems = new Set([...state.allItems, action.item]);
      const addAlias = (items, alias) => {
        const itemsWithAlias = items[alias] || new Set();
        itemsWithAlias.add(action.item);
        return { ...items, [alias]: itemsWithAlias };
      };
      let newItems = addAlias(newState.items, action.item.name.toLowerCase());
      action.item.aliases.forEach((alias) => (newItems = addAlias(newItems, alias.toLowerCase())));
      return { ...newState, items: newItems, allItems: newAllItems };
    case type.ADD_OPTION_GRAPH:
      return { ...state, optionGraphs: { ...state.optionGraphs, [action.optionGraph.id]: action.optionGraph } };
    case type.LOAD_SNAPSHOT:
      return { ...state, ...action.snapshot };
    case type.CHANGE_ROOM:
      return { ...state, room: action.room };
    case type.RECORD_CHANGES:
      return { ...state, recordChanges: true };
    case type.SET_PLAYER:
      return { ...state, player: action.player };
    case type.ADD_VALUE:
      if (!action.force && state.customState.hasOwnProperty(action.propertyName)) {
        throw Error(
          `Tried to add a persistent property called "${action.propertyName}" but a property with that name already exists. ` +
            "Pass 'force=true' if you're certain you want to overwrite the existing value."
        );
      }
      return { ...state, customState: { ...state.customState, [action.propertyName]: action.value } };
    case type.UPDATE_VALUE:
      if (!state.customState.hasOwnProperty(action.propertyName)) {
        throw Error(
          `Tried to update a persistent property called "${action.propertyName}" but no property with that name exists.`
        );
      }
      return { ...state, customState: { ...state.customState, [action.propertyName]: action.value } };
    case type.FORGET_VALUE:
      const customStateCopy = { ...state.customState };
      delete customStateCopy[action.propertyName];
      return { ...state, customState: customStateCopy };
    case type.CLEAN_STATE:
      return {
        ...initialState,
        game: state.game,
        debugMode: state.debugMode,
        keywords: state.keywords
      };
    case type.SET_STARTING_ROOM:
      return { ...state, startingRoom: action.startingRoom };
    case type.CY_SAY:
      return { ...state, cySay: action.cySay, cyChoose: null };
    case type.CY_CHOOSE:
      return { ...state, cyChoose: action.cyChoose, cySay: null };
    case type.CY_RECORD:
      return { ...state, cyCommands: [], cySay: null, cyChoose: null };
    case type.OVERRIDE_EVENT_TIMEOUT:
      return {
        ...state,
        eventTimeoutOverride: action.eventTimeoutOverride,
        eventTurnsOverride: action.eventTurnsOverride
      };
    case type.ADD_AUTO_ACTION:
      return { ...state, autoActions: [...state.autoActions, action.autoAction] };
    default:
      return state;
  }
}

function updateCyCommands(state, output, paged) {
  if (output) {
    const funcName = state.cySay ? "say" : state.cyChoose ? "choose" : null;

    if (!funcName) {
      return state;
    }

    // Construct the new Cypress command
    const newLineIndex = output.indexOf("\n");
    const cutoffIndex = Math.min(newLineIndex, outputSnippetLength);
    const outputSnippet = output.substring(0, newLineIndex > -1 ? cutoffIndex : outputSnippetLength);
    const lastIndex = Math.max(outputSnippet.lastIndexOf(" "), outputSnippet.lastIndexOf("."));
    const input = state.cySay ? state.cySay : state.cyChoose;
    const firstOutput = !state.interaction.currentPage.includes("###### `>`") || paged;
    const options = firstOutput ? ", { global: true }" : "";
    const command = `cy.${funcName}("${input}", "${outputSnippet.substring(0, lastIndex)}"${options});`;

    // Update Cypress commands and remove the Cypress records so we don't add them again.
    return { ...state, cyCommands: [...state.cyCommands, command], cySay: null, cyChoose: null };
  } else {
    return state;
  }
}
