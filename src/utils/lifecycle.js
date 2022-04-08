import { processEvent } from "./eventUtils";
import { getStore } from "../redux/storeRegistry";
import { selectGame } from "./selectors";
import { nextTurn, changeInteraction } from "../redux/gameActions";
import { Interaction } from "../game/interactions/interaction";

export async function handleTurnEnd() {
  const events = getStore().getState().game.events;

  for (let i in events) {
    await processEvent(events[i]);
  }

  for (let i in selectGame().schedules) {
    await processEvent(selectGame().schedules[i].currentEvent);
  }

  // End the turn
  return getStore().dispatch(nextTurn());
}

export function goToRoom(room) {
  selectGame().room = room;
  room.revealVisibleItems();
  return room.actionChain;
}

export function clearPage(newPage) {
  getStore().dispatch(changeInteraction(new Interaction(newPage || "")));
}
