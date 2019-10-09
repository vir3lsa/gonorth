import * as type from "../gameActionTypes";
import Interaction from "../../game/interaction";

const initialState = {
  turn: 1,
  inBrowser: false,
  debugMode: false,
  interaction: new Interaction("Loading...", []),
  verbNames: new Set(),
  itemNames: new Set()
};

export default function(state = initialState, action) {
  switch (action.type) {
    case type.NEW_GAME:
      return { ...state, ...action.payload };
    case type.CHANGE_INTERACTION:
      return { ...state, interaction: action.payload };
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
