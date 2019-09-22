import { NEW_GAME, CHANGE_INTERACTION } from "../gameActionTypes";
import Interaction from "../../game/interaction";

const initialState = {
  inBrowser: false,
  debugMode: false,
  interaction: new Interaction("Loading...", [])
};

export default function(state = initialState, action) {
  switch (action.type) {
    case NEW_GAME:
      return { ...state, ...action.payload };
    case CHANGE_INTERACTION:
      return { ...state, interaction: action.payload };
    default:
      return state;
  }
}
