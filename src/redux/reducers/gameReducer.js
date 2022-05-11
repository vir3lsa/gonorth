import * as type from "../gameActionTypes";
import {
  Interaction,
  Append,
  AppendInput
} from "../../game/interactions/interaction";
// import { Item } from "../../game/items/item";

export const initialState = {
  turn: 1,
  debugMode: false,
  player: null,
  interaction: new Interaction("Loading..."),
  image: null,
  lastChange: Date.now(),
  verbNames: {},
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
  startingRoom: null
};

export default function (state = initialState, action) {
  switch (action.type) {
    case type.NEW_GAME:
      return { ...state, ...action.payload };
    case type.CHANGE_INTERACTION:
      const interaction = action.payload;

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

      return { ...state, interaction, lastChange: Date.now() };
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
      if (state.customState.hasOwnProperty(action.propertyName)) {
        throw Error(
          `Tried to add a persistent property called "${action.propertyName}" but a property with that name already exists.`
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
    case type.CLEAN_STATE:
      return {
        ...initialState,
        game: state.game,
        debugMode: state.debugMode,
        keywords: state.keywords
      };
    case type.SET_STARTING_ROOM:
      return { ...state, startingRoom: action.startingRoom };
    default:
      return state;
  }
}
