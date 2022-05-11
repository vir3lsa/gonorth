import { processEvent } from "./eventUtils";
import { getPersistor, getStore, unregisterStore } from "../redux/storeRegistry";
import { selectConfig, selectEvents, selectGame } from "./selectors";
import { nextTurn, changeInteraction, newGame, changeRoom, loadSnapshot } from "../redux/gameActions";
import { Interaction } from "../game/interactions/interaction";

export async function handleTurnEnd() {
  const events = selectEvents();

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
  getStore().dispatch(changeRoom(room));
  room.revealVisibleItems();
  return room.actionChain;
}

export function clearPage(newPage) {
  getStore().dispatch(changeInteraction(new Interaction(newPage || "")));
}

// Saves game state to local storage.
export function checkpoint() {
  if (!selectConfig().skipPersistence) {
    getPersistor().persistSnapshot();
  }
}

export function loadSave() {
  if (!selectConfig().skipPersistence) {
    const snapshot = getPersistor().loadSnapshot();
    getStore().dispatch(loadSnapshot(snapshot));
  }
}

export function deleteSave() {
  const game = selectGame();

  if (!game.config.skipPersistence) {
    getPersistor().purgeSnapshot();
  }

  // Reset state whether we're skipping persistence or not.
  const snapshot = getPersistor().loadInitialStateSnapshot();
  getStore().dispatch(loadSnapshot(snapshot));
}
