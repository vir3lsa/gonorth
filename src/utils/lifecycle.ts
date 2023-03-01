import { AnyAction } from "redux";
import { processEvent } from "./eventUtils";
import { getPersistor, getStore } from "../redux/storeRegistry";
import { selectConfig, selectEvents, selectGame, selectItem, selectRoom, selectTurn } from "./selectors";
import {
  nextTurn,
  changeInteraction,
  changeRoom,
  loadSnapshot,
  cleanState,
  setPlayer,
  recordChanges,
  addAutoInput
} from "../redux/gameActions";
import { Interaction } from "../game/interactions/interaction";
import { Room } from "../game/items/room";
import { Item } from "../game/items/item";
import { RandomText, PagedText } from "../game/interactions/text";
import { OptionGraph } from "../game/interactions/optionGraph";
import { AutoAction } from "../game/input/autoAction";
import { playerHasItem } from "./sharedFunctions";

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

export function goToRoom(room: Room | Item | string) {
  let roomObj = typeof room === "string" ? [...selectItem(room)] : room;

  if (Array.isArray(roomObj)) {
    roomObj = roomObj[0];
  }

  if (!roomObj?.isRoom) {
    throw Error(
      `Tried to change room but the object provided is not a Room. Its name field (if any) is: ${roomObj?.name}`
    );
  }

  const definiteRoomObj = roomObj as unknown as RoomT;
  getStore().dispatch(changeRoom(definiteRoomObj));
  definiteRoomObj.revealVisibleItems();
  return definiteRoomObj.actionChain;
}

export function clearPage(newPage: string = "") {
  getStore().dispatch(changeInteraction(new Interaction(newPage)) as unknown as AnyAction);
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
  resetStateToPrePlay();
}

export function resetStateToPrePlay() {
  getStore().dispatch(cleanState());
  createPlayer();
  selectGame().initialiser();
  initAutoActions();
  getStore().dispatch(recordChanges());
}

export function createPlayer() {
  // Create the player after registering the store as Items need to inspect an existing store.
  getStore().dispatch(setPlayer(new Item("player", "You look as you normally do.", false)));
}

export function resetToCheckpoint() {
  resetStateToPrePlay();
  loadSave();
}

export function play() {
  const game = selectGame();
  let titlePage = `# ${game.title || "Untitled"}`;

  if (game.author) {
    titlePage += `\n### By ${game.author}`;
  }

  const titleScreenGraph = new OptionGraph(
    "titleScreen",
    {
      id: "root",
      actions: new PagedText(titlePage),
      options: {
        play: {
          condition: () => selectTurn() === 1,
          actions: () => game.introActions.chain(),
          exit: true
        },
        continue: {
          condition: () => selectTurn() > 1,
          actions: () => goToRoom(selectRoom()).chain(),
          exit: true
        },
        "New Game": {
          condition: () => selectTurn() > 1,
          node: "newGameWarning"
        }
      }
    },
    {
      id: "newGameWarning",
      actions: new PagedText(
        "This will delete the current save game file and start a new game.\n\nDo you want to continue?"
      ),
      options: {
        yes: {
          actions: () => {
            deleteSave();
            game.introActions.chain();
          },
          exit: true
        },
        cancel: "root"
      }
    }
  );

  getStore().dispatch(recordChanges());
  loadSave(); // This must be after we start recording changes.
  return titleScreenGraph.commence().chain();
}

export function gameOver() {
  return endGame("GAME OVER");
}

export function theEnd() {
  return endGame("THE END");
}

function endGame(message: string) {
  const resurrectionText = new RandomText(
    "Groggily, you get to your feet.",
    "Had it been a premonition or just a bad dream? You shiver and try to forget it.",
    "Why are your eyes closed? You open them and find yourself back where you were before."
  );

  const gameOverGraph = new OptionGraph("gameOver", {
    id: "root",
    actions: new PagedText(`# ${message}`),
    options: {
      "Reload checkpoint": {
        actions: [() => clearPage(), resurrectionText, resetToCheckpoint, () => goToRoom(selectRoom())],
        exit: true
      },
      "Return to main menu": {
        actions: play,
        exit: true
      }
    }
  });

  selectEvents().forEach((event: EventT) => event.cancel());
  return gameOverGraph.commence().chain();
}

export function initAutoActions() {
  const autoTakeItem = new AutoAction.Builder()
    .withCondition(({ verb, item }: Context) => !verb.remote && item?.holdable && !playerHasItem(item))
    .withInputs(({ item }: Context) => `take ${item.name}`)
    .build();

  const autoTakeOtherItem = new AutoAction.Builder()
    .withCondition(({ verb, other }: Context) => !verb.remote && other?.holdable && !playerHasItem(other))
    .withInputs(({ other }: Context) => `take ${other!.name}`)
    .build();

  addAutoAction(autoTakeItem);
  addAutoAction(autoTakeOtherItem);
}

export function addAutoAction(autoAction: AutoActionT) {
  getStore().dispatch(addAutoInput(autoAction));
}