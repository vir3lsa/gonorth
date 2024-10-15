import {
  initGame,
  play,
  addEvent,
  attach,
  goToStartingRoom,
  selectOptionGraph,
  setStartingRoom,
  setInventoryCapacity,
  getItem
} from "./gonorth";
import { unregisterStore } from "./redux/storeRegistry";
import { Item } from "./game/items/item";
import { Room } from "./game/items/room";
import { ActionChain } from "./utils/actionChain";
import { Verb } from "./game/verbs/verb";
import { TIMEOUT_MILLIS, TIMEOUT_TURNS, Event, EventBuilder } from "./game/events/event";
import { handleTurnEnd } from "./utils/lifecycle";
import { Parser } from "./game/input/parser";
import { selectInventory, selectRoom, selectTurn } from "./utils/selectors";
import { selectCurrentPage } from "./utils/testSelectors";
import { clickNext } from "./utils/testFunctions";
import { OptionGraph } from "./game/interactions/optionGraph";

const title = "Space Auctioneer 2";

jest.mock("./utils/consoleIO");
const consoleIO = require("./utils/consoleIO");

let game, x: number, y: number, room: Room;

const eventTest = async (builder: EventBuilder, expectation: () => boolean) => {
  const event = builder.build();
  addEvent(event);
  await handleTurnEnd();
  expect(expectation()).toBeTruthy();
  event.cancel();
};

describe("Game class", () => {
  beforeEach(() => {
    game = initGame("title", "", { debugMode: false });
    room = new Room("stairs", "description");
    setStartingRoom(room);
    x = y = 0;
  });

  it("defaults output to Loading", () => {
    expect(selectCurrentPage()).toBe("Loading...");
  });

  it("throws an error if trying to attach with no container", () => {
    expect(attach).toThrow(Error);
  });

  it("goes to the starting room", () => {
    goToStartingRoom();
    expect(selectRoom()).toBe(room);
  });

  it("returns starting room action chain", () => {
    const chain = goToStartingRoom();
    expect(chain instanceof ActionChain).toBeTruthy();
  });

  /*
   * First turn is turn 1.
   * Going to starting room shouldn't increment turn.
   * Turn should only increment once at the very end of the chain.
   * End turn should therefore be 2.
   * Using the 'receiveInput' method also causes the turn to increment, which is correct because
   * a new turn should start each time the player does something. We're not testing that here
   * though, so using Parser directly, which doesn't increment the turn.
   */
  it("increments the turn at the end of a chain", async () => {
    room.addVerb(new Verb("shimmy", true, ["one", "two", "three"]));
    goToStartingRoom();
    expect(selectTurn()).toBe(1);
    setTimeout(async () => {
      await clickNext();
      await clickNext();
    });
    await new Parser("shimmy").parse();
    expect(selectTurn()).toBe(2);
  });

  it("updates the inventory capacity", () => {
    setInventoryCapacity(7);
    expect(selectInventory().capacity).toBe(7);
    expect(selectInventory().free).toBe(7);
  });

  describe("events", () => {
    it("triggers events with no condition and no timeout immediately", () => {
      eventTest(
        new Event.Builder("1").withAction(() => x++),
        () => x === 1
      );
    });

    it("triggers events with no timeout when the condition is met", () => {
      x = 10;
      eventTest(
        new Event.Builder("2").withAction(() => x++).withCondition(() => x === 10),
        () => x === 11
      );
    });

    it("does not trigger events when the condition is not met", () => {
      eventTest(
        new Event.Builder("3").withAction(() => x++).withCondition(() => x === 10),
        () => x === 0
      );
    });

    it("does not trigger timed events immediately", () => {
      const event = new Event.Builder("4")
        .withAction(() => x++)
        .withTimeout(1000)
        .withTimeoutType(TIMEOUT_MILLIS);
      eventTest(event, () => x === 0);
    });

    it("does not trigger count down events immediately", () => {
      const event = new Event.Builder("5")
        .withAction(() => x++)
        .withTimeout(5)
        .withTimeoutType(TIMEOUT_TURNS);
      eventTest(event, () => x === 0);
    });

    it("triggers timed events after the timeout has passed", () => {
      addEvent(
        new Event.Builder("6")
          .withAction(() => x++)
          .withTimeout(10)
          .withTimeoutType(TIMEOUT_MILLIS)
      );
      handleTurnEnd();
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          expect(x).toBe(1);
          resolve();
        }, 11)
      );
    });

    it("triggers count down events after the required turns have passed", async () => {
      addEvent(
        new Event.Builder("7")
          .withAction(() => x++)
          .withTimeout(2)
          .withTimeoutType(TIMEOUT_TURNS)
      );
      await handleTurnEnd();
      await handleTurnEnd();
      await handleTurnEnd();
      expect(x).toBe(1);
    });

    it("chains events", () => {
      const event = new Event.Builder("8").withActions(
        () => x++,
        () => y++
      );
      eventTest(event, () => x === 1 && y === 1);
    });

    it("waits for a chain to finish before triggering", async () => {
      let eventPromise = Promise.resolve();
      setTimeout(() => {
        eventPromise = new Event.Builder("9")
          .withAction(() => x++)
          .build()
          .trigger();
        expect(x).toBe(0);
        clickNext();
      });
      await new Verb("verb", true, ["one", "two"]).attempt();
      await eventPromise;
      expect(x).toBe(1);
    });

    it("triggers waiting events in the right order", async () => {
      let p1 = Promise.resolve();
      let p2 = Promise.resolve();
      x = 1;
      setTimeout(() => {
        p1 = new Event.Builder("11")
          .withAction(() => x++)
          .build()
          .trigger();
        p2 = new Event.Builder("22")
          .withAction(() => (x *= 3))
          .build()
          .trigger();
        expect(x).toBe(1);
        clickNext();
      });
      await new Verb("verb", true, ["one", "two"]).attempt();
      await p1;
      await p2;
      expect(x).toBe(6);
    });

    it("calls onComplete when the event completes", async () => {
      const event = new Event.Builder("33").withAction(() => x++).withOnComplete(async () => x++);
      addEvent(event);
      await handleTurnEnd();
      expect(x).toBe(2);
    });
  });
});

describe("goNORTH", () => {
  beforeEach(() => {
    unregisterStore();
    consoleIO.output = jest.fn();
    consoleIO.showOptions = jest.fn();
  });

  it("Creates a game with the given title", () => {
    const game = initGame("The Witch's Grotto", "", { debugMode: false });
    expect(game.title).toBe("The Witch's Grotto");
  });

  it("Prints the game title", () => {
    initGame(title, "", { debugMode: true });
    play();
    expect(consoleIO.output.mock.calls[0][0]).toInclude("# Space Auctioneer 2");
  });
});

test("getItem can be used to retrieve items from the store", () => {
  initGame("title", "", { debugMode: false });
  new Item.Builder("toolbox").withDescription("red and angular").build();
  expect(getItem("toolbox")?.description).toBe("red and angular");
});

test("selectOptionGraph can be used to retrieve option graphs from the store", () => {
  new OptionGraph.Builder("test").withNodes(new OptionGraph.NodeBuilder("root")).build();
  expect(selectOptionGraph("test").nodes.length).toBe(1);
});
