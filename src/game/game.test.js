import Game from "./game";
import { initStore } from "../redux/store";
import { getStore, unregisterStore } from "../redux/storeRegistry";
import { Event, TIMEOUT_MILLIS, TIMEOUT_TURNS } from "./event";
import Option from "./option";
import Room from "./room";
import { Verb } from "./verb";
import { newGame } from "../redux/gameActions";
import { receiveInput } from "../utils/inputReceiver";

jest.mock("../utils/consoleIO");

const clickNext = () =>
  getStore()
    .getState()
    .game.interaction.options[0].action();

let game, x, y, room;

const eventTest = async (event, expectation) => {
  game.addEvent(event);
  await game.handleTurnEnd();
  expect(expectation()).toBeTruthy();
  event.cancel();
};

const selectTurn = () => getStore().getState().game.turn;

describe("Game class", () => {
  beforeEach(() => {
    unregisterStore();
    initStore();
    game = new Game("title");
    room = new Room("stairs", "description", new Option("do it"));
    getStore().dispatch(newGame(game, true, false));
    game.startingRoom = room;
    x = y = 0;
  });

  it("defaults output to Loading", () => {
    expect(getStore().getState().game.interaction.currentPage).toBe(
      "Loading..."
    );
  });

  it("throws an error if trying to attach with no container", () => {
    expect(game.attach).toThrow(Error);
  });

  it("goes to the starting room", () => {
    game.goToStartingRoom();
    expect(game.room).toBe(room);
  });

  it("returns starting room text wrapper", () => {
    const wrapper = game.goToStartingRoom();
    expect(wrapper.text.paged).toBeTruthy();
    expect(wrapper.options[0].label).toBe("do it");
  });

  it("increments the turn at the end of a chain", async () => {
    room.addVerb(new Verb("shimmy", true, ["one", "two", "three"]));
    game.goToStartingRoom();
    setTimeout(async () => {
      await clickNext();
      await clickNext();
    });
    await receiveInput("shimmy");
    expect(selectTurn()).toBe(2);
  });

  describe("events", () => {
    it("triggers events with no condition and no timeout immediately", () => {
      eventTest(new Event(() => x++), () => x === 1);
    });

    it("triggers events with no timeout when the condition is met", () => {
      x = 10;
      eventTest(new Event(() => x++, () => x === 10), () => x === 11);
    });

    it("does not trigger events when the condition is not met", () => {
      eventTest(new Event(() => x++, () => x === 10), () => x === 0);
    });

    it("does not trigger timed events immediately", () => {
      const event = new Event(() => x++, true, 1000, TIMEOUT_MILLIS);
      eventTest(event, () => x === 0);
    });

    it("does not trigger count down events immediately", () => {
      const event = new Event(() => x++, true, 5, TIMEOUT_TURNS);
      eventTest(event, () => x === 0);
    });

    it("triggers timed events after the timeout has passed", () => {
      game.addEvent(new Event(() => x++, true, 10, TIMEOUT_MILLIS));
      game.handleTurnEnd();
      return new Promise(resolve =>
        setTimeout(() => {
          expect(x).toBe(1);
          resolve();
        }, 11)
      );
    });

    it("triggers count down events after the required turns have passed", async () => {
      game.addEvent(new Event(() => x++, true, 2, TIMEOUT_TURNS));
      await game.handleTurnEnd();
      await game.handleTurnEnd();
      await game.handleTurnEnd();
      expect(x).toBe(1);
    });

    it("chains events", () => {
      const event = new Event([() => x++, () => y++]);
      eventTest(event, () => x === 1 && y === 1);
    });

    it("waits for a chain to finish before triggering", async () => {
      new Verb("verb", true, ["one", "two"]).attempt();
      const promise = new Event(() => x++).trigger();
      expect(x).toBe(0);
      clickNext();
      await promise;
      expect(x).toBe(1);
    });

    it("triggers waiting events in the right order", async () => {
      new Verb("verb", true, ["one", "two"]).attempt();
      x = 1;
      const p1 = new Event(() => x++).trigger();
      const p2 = new Event(() => (x *= 3)).trigger();
      expect(x).toBe(1);
      clickNext();
      await p1;
      await p2;
      expect(x).toBe(6);
    });

    it("calls onComplete when the event completes", async () => {
      const event = new Event(() => x++);
      event.onComplete = () => x++;
      game.addEvent(event);
      await game.handleTurnEnd();
      expect(x).toBe(2);
    });
  });
});
