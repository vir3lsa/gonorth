import * as type from "../gameActionTypes";
import {
  Interaction,
  Append,
  AppendInput,
} from "../../game/interactions/interaction";

const initialState = {
  turn: 1,
  inBrowser: false,
  debugMode: false,
  interaction: new Interaction("Loading..."),
  lastChange: Date.now(),
  verbNames: {},
  itemNames: new Set(),
  actionChainPromise: null,
  events: [],
  keywords: {},
};

export default function (state = initialState, action) {
  switch (action.type) {
    case type.NEW_GAME:
      return { ...state, ...action.payload };
    case type.CHANGE_INTERACTION:
      const interaction = action.payload;

      if (interaction instanceof Append && state.interaction.currentPage) {
        interaction.currentPage = `${state.interaction.currentPage}\n\n${interaction.currentPage}`;

        if (
          !interaction.options &&
          interaction.renderOptions &&
          !state.interaction.nextButtonRendered
        ) {
          // Copy concrete options (not 'Next') from previous interaction
          // Required e.g. by Events, which append text at indeterminate times
          interaction.options = state.interaction.options;
        }

        if (
          typeof interaction.renderNextButton === "undefined" &&
          !(interaction instanceof AppendInput)
        ) {
          interaction.renderNextButton = state.interaction.renderNextButton;
        }
      }

      return { ...state, interaction, lastChange: Date.now() };
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
        itemNames: new Set([
          ...state.itemNames,
          ...action.payload.map((i) => i.toLowerCase()),
        ]),
      };
    case type.CHAIN_STARTED:
      return {
        ...state,
        actionChainPromise: state.actionChainPromise || action.payload,
      };
    case type.CHAIN_ENDED:
      const actionChainPromise =
        action.payload === state.actionChainPromise
          ? null
          : state.actionChainPromise;
      return { ...state, actionChainPromise };
    case type.ADD_EVENT:
      const events = [...state.events, action.payload];
      return { ...state, events };
    case type.ADD_KEYWORDS:
      return { ...state, keywords: { ...state.keywords, ...action.keywords } };
    default:
      return state;
  }
}
