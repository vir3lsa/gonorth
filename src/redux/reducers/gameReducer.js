import * as type from "../gameActionTypes";
import {
  Interaction,
  Append,
  AppendInput
} from "../../game/interactions/interaction";

const initialState = {
  turn: 1,
  inBrowser: false,
  debugMode: false,
  interaction: new Interaction("Loading..."),
  image: null,
  lastChange: Date.now(),
  verbNames: {},
  itemNames: new Set(),
  actionChainPromise: null,
  events: [],
  keywords: {},
  // The following parts of the model are used for debugging only.
  rooms: {},
  allItemNames: new Set(),
  items: {},
  optionGraphs: {}
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
      const addAlias = (items, alias) => {
        const itemsWithAlias = items[alias] || new Set();
        itemsWithAlias.add(action.item);
        return { ...items, [alias]: itemsWithAlias };
      };
      let newItems = addAlias(newState.items, action.item.name.toLowerCase());
      action.item.aliases.forEach((alias) => (newItems = addAlias(newItems, alias.toLowerCase())));
      return { ...newState, items: newItems };
    case type.ADD_OPTION_GRAPH:
      return { ...state, optionGraphs: { ...state.optionGraphs, [action.optionGraph.id]: action.optionGraph } };
    default:
      return state;
  }
}
