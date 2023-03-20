import { ADD_LOG_ENTRY } from "../gameActionTypes";
import reducer from "./gameReducer";

describe("add_log_entry", () => {
  test("creates a new entry for each player input", () => {
    let state = reducer(undefined, { type: ADD_LOG_ENTRY, payload: "a", playerTurn: true } as ReduxAction);
    state = reducer(state, { type: ADD_LOG_ENTRY, payload: "b", playerTurn: true } as ReduxAction);
    expect(state.rollingLog.length).toBe(2);
    expect(state.rollingLog[0].input).toBe("a");
    expect(state.rollingLog[1].input).toBe("b");
  });

  test("creates a new log entry for output if there isn't one already", () => {
    const state = reducer(undefined, { type: ADD_LOG_ENTRY, payload: "B", playerTurn: false } as ReduxAction);
    expect(state.rollingLog.length).toBe(1);
    expect(state.rollingLog[0].output).toEqual(["B"]);
  });

  test("appends to existing entry when there's one already", () => {
    let state = reducer(
      { rollingLog: [{ output: ["A"] }] } as StoreState,
      { type: ADD_LOG_ENTRY, payload: "B", playerTurn: false } as ReduxAction
    );
    state = reducer(state, { type: ADD_LOG_ENTRY, payload: "C", playerTurn: false } as ReduxAction);
    expect(state.rollingLog.length).toBe(1);
    expect(state.rollingLog[0].output).toEqual(["A", "B", "C"]);
  });

  test("limits the log length, truncating entries from the beginning", () => {
    let state = reducer(
      {
        rollingLog: [
          { output: ["Z"] },
          { output: ["Y"] },
          { output: ["1"] },
          { output: ["2"] },
          { output: ["3"] },
          { output: ["4"] },
          { output: ["5"] },
          { output: ["6"] },
          { output: ["7"] },
          { output: ["8"] }
        ]
      } as StoreState,
      { type: ADD_LOG_ENTRY, payload: "a", playerTurn: true } as ReduxAction
    );
    expect(state.rollingLog.length).toBe(10);
    expect(state.rollingLog).toEqual([
      { output: ["Y"] },
      { output: ["1"] },
      { output: ["2"] },
      { output: ["3"] },
      { output: ["4"] },
      { output: ["5"] },
      { output: ["6"] },
      { output: ["7"] },
      { output: ["8"] },
      { input: "a" }
    ]);
  });
});
