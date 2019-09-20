import { CHANGE_OUTPUT } from "./gameActionTypes";

export const changeOutput = output => ({
  type: CHANGE_OUTPUT,
  payload: output
});
