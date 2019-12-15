import { selectLastChange } from "./selectors";

const REACTION_MILLIS = 350;

// Check the player has had time to react to new output before accepting input
export function reactionTimePassed() {
  const millisElapsed = Date.now() - selectLastChange();
  return millisElapsed > REACTION_MILLIS;
}
