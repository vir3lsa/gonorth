import * as type from "../gameActionTypes";
import Interaction from "../../game/interaction";

const initialState = {
  inBrowser: false,
  debugMode: false,
  interaction: new Interaction("Loading...", [])
};

export default function(state = initialState, action) {
  switch (action.type) {
    case type.NEW_GAME:
      return { ...state, ...action.payload };
    case type.CHANGE_INTERACTION:
      return { ...state, interaction: action.payload };
    case type.RECEIVE_INPUT:
      return { ...state, playerInput: action.payload };
    default:
      return state;
  }
}
