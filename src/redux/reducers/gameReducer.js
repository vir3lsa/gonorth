import { CHANGE_OUTPUT } from "../gameActionTypes";

const initialState = {
  output: "Loading..."
};

export default function(state = initialState, action) {
  switch (action.type) {
    case CHANGE_OUTPUT:
      return { ...state, output: action.payload };
    default:
      return state;
  }
}
