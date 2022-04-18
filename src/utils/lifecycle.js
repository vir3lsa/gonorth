import { processEvent } from "./eventUtils";
import { getPersistor, getStore } from "../redux/storeRegistry";
import { selectConfig, selectEvents, selectGame, selectTurn } from "./selectors";
import { nextTurn, changeInteraction, resetState, newGame } from "../redux/gameActions";
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
  selectGame().room = room;
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
    getPersistor().loadSnapshot();
  }
}

export function deleteSave() {
  const game = selectGame();

  if (!game.config.skipPersistence) {
    getPersistor().purgeSnapshot();
  }

  getStore().dispatch(resetState());
  getStore().dispatch(newGame(game, game.config.debugMode));
}
