import * as type from "../gameActionTypes";
import { Interaction, Append } from "../../game/interaction";

const initialState = {
  turn: 1,
  inBrowser: false,
  debugMode: false,
  interaction: new Interaction("Loading..."),
  verbNames: new Set(),
  itemNames: new Set()
};

export default function(state = initialState, action) {
  switch (action.type) {
    case type.NEW_GAME:
      return { ...state, ...action.payload };
    case type.CHANGE_INTERACTION:
      const interaction = action.payload;

      if (interaction instanceof Append && state.interaction.currentPage) {
        interaction.currentPage = `${state.interaction.currentPage}\n\n${interaction.currentPage}`;

        if (!interaction.options) {
          // Copy concrete options (not 'Next') from previous interaction
          interaction.options = state.interaction._options;
        }

        if (typeof interaction.nextOnLastPage === "undefined") {
          interaction.nextOnLastPage = state.interaction.nextOnLastPage;
        }
      }

      return { ...state, interaction };
    case type.RECEIVE_INPUT:
      return { ...state, playerInput: action.payload };
    case type.NEXT_TURN:
      return { ...state, turn: state.turn + 1 };
    case type.VERB_CREATED:
      return {
        ...state,
        verbNames: new Set([...state.verbNames, ...action.payload])
      };
    case type.ITEMS_REVEALED:
      return {
        ...state,
        itemNames: new Set([...state.itemNames, ...action.payload])
      };
    default:
      return state;
  }
}
