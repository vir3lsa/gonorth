import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { initGame } from "../../gonorth";
import { initStore } from "../../redux/store";
import { newGame } from "../../redux/gameActions";
import { OptionGraph } from "./optionGraph";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { selectRoom } from "../../utils/selectors";
import { selectTurn } from "../../utils/selectors";
import { Verb } from "../verbs/verb";
import { Room } from "../items/room";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game, optionGraph, x;
const doIt = new Verb("do it", true, () => x++);

const graphNodes = [
  {
    id: "alpha",
    actions: "goat",
    options: { one: "beta", two: "epsilon", three: "three", four: "four" }
  },
  { id: "beta", actions: "lamb", options: { three: "gamma", four: "delta" } },
  { id: "epsilon", actions: "falcon" },
  { id: "three", noEndTurn: true, actions: "bye" },
  { id: "four", actions: () => doIt.attempt() },
  {
    id: "gamma",
    actions: [() => x++, "sheep"]
  },
  {
    id: "delta",
    actions: "rabbit"
  }
];

const speechNodes = [
  {
    id: "hello",
    actions: "hello",
    options: { question: "question", compliment: "compliment", bye: "bye" }
  },
  {
    id: "question",
    actions: "question",
    options: { question: "question", compliment: "compliment", bye: "bye" }
  },
  {
    id: "compliment",
    actions: "compliment",
    options: { question: "question", compliment: "compliment", bye: "bye" }
  },
  { id: "bye", actions: "bye" }
];

const mazeNodes = [
  {
    id: "entrance",
    actions: "you enter the labyrinth",
    options: {
      left: { node: "left", actions: () => x++ },
      right: { node: "right", actions: [() => x++, () => x++] },
      stay: [() => x++, () => x++, "you stay"],
      stayPut: { actions: () => x++ },
      noNext: { actions: "No button" }
    }
  },
  {
    id: "left",
    actions: "you go left"
  },
  {
    id: "right",
    actions: "you go right"
  }
];

const dynamicOptionsNodes = [
  {
    id: "start",
    actions: "test",
    options: () => ({
      [x]: null
    })
  }
];

const nullOptionNodes = [
  {
    id: "start",
    actions: "test",
    options: { one: null }
  }
];

const optionalOptionsNodes = [
  {
    id: "start",
    actions: "test",
    options: {
      one: { condition: () => x < 5, actions: "one" },
      two: { condition: () => x > 0, actions: "two" }
    }
  }
];

const exitOptionNodes = [
  {
    id: "start",
    actions: "test",
    options: { one: { actions: () => x++, exit: true } }
  }
];

const room = new Room("room", "turret");

const roomOptionNodes = [
  {
    id: "start",
    actions: "test",
    options: { one: { actions: () => x++, room } }
  }
];

const createGraph = (nodes) => {
  const graph = new OptionGraph(...nodes);
  return graph.commence().chain();
};

beforeEach(async () => {
  unregisterStore();
  initStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", false);
  optionGraph = new OptionGraph(...graphNodes);
  x = 0;
  getStore().dispatch(newGame(game, true, false));
  await optionGraph.commence().chain();
});

test("optionGraph displays text", async () => {
  expect(selectCurrentPage()).toInclude("goat");
});

test("optionGraph displays options", async () => {
  expect(selectOptions()[0].label).toBe("one");
  expect(selectOptions()[1].label).toBe("two");
});

test("optionGraph exits if a node has no options", async () => {
  await selectOptions()[1].action();
  expect(selectOptions()).toBeNull();
});

test("optionGraph displays text two levels deep", async () => {
  await selectOptions()[0].action();
  expect(selectCurrentPage()).toInclude("lamb");
});

test("optionGraph displays options two levels deep", async () => {
  await selectOptions()[0].action();
  expect(selectOptions()[0].label).toBe("three");
  expect(selectOptions()[1].label).toBe("four");
});

test("optionGraph carries out additional actions", async () => {
  await selectOptions()[0].action();
  await selectOptions()[0].action();
  expect(selectCurrentPage()).toInclude("three");
  expect(x).toBe(1);
});

test("optionGraph presents nodes by ID", () => {
  expect(optionGraph.getNode("alpha")).toStrictEqual(graphNodes[0]);
  expect(optionGraph.getNode("beta")).toStrictEqual(graphNodes[1]);
  expect(optionGraph.getNode("gamma")).toStrictEqual(graphNodes[5]);
  expect(optionGraph.getNode("delta")).toStrictEqual(graphNodes[6]);
  expect(optionGraph.getNode("epsilon")).toStrictEqual(graphNodes[2]);
});

test("optionGraph doesn't end the turn for some options", async () => {
  const turn = selectTurn();
  await selectOptions()[2].action();
  expect(selectTurn()).toBe(turn);
});

test("optionGraph does end the turn for most options", async () => {
  const turn = selectTurn();
  await selectOptions()[0].action();
  expect(selectTurn()).toBe(turn + 1);
});

test("start node can be set", () => {
  optionGraph.setStartNode(optionGraph.getNode("beta"));
  optionGraph.commence().chain();
  expect(selectOptions()[0].label).toBe("three");
  expect(selectOptions()[1].label).toBe("four");
});

test("start node can be set by id", () => {
  optionGraph.setStartNode("beta");
  optionGraph.commence().chain();
  expect(selectOptions()[0].label).toBe("three");
  expect(selectOptions()[1].label).toBe("four");
});

test("optionGraph exits if a node attempts a verb but has no options", async () => {
  await selectOptions()[3].action();
  expect(selectOptions()).toBeNull();
});

test("optionGraph repeats nodes by default", async () => {
  await createGraph(speechNodes);
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(3);
  expect(selectOptions()[0].label).toBe("question");
});

test("optionGraph does not repeat nodes if instructed", async () => {
  const graph = new OptionGraph(...speechNodes);
  graph.allowRepeats = false;
  await graph.commence().chain();
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(2);
  expect(selectOptions()[0].label).not.toBe("question");
});

test("individual nodes can opt to not repeat", async () => {
  const nodes = [...speechNodes];
  nodes[1].allowRepeats = false;
  await createGraph(nodes);
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(2);
  expect(selectOptions()[0].label).not.toBe("question");
});

test("individual nodes can opt to repeat", async () => {
  const nodes = [...speechNodes];
  nodes[1].allowRepeats = true;
  const graph = new OptionGraph(...nodes);
  graph.allowRepeats = false;
  await graph.commence().chain();
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(3);
  expect(selectOptions()[0].label).toBe("question");
});

test("options can have actions", async () => {
  await createGraph(mazeNodes);
  await selectOptions()[0].action();
  expect(selectCurrentPage()).toInclude("you go left");
  expect(x).toBe(1);
});

test("options can have arrays of actions", async () => {
  await createGraph(mazeNodes);
  await selectOptions()[1].action();
  expect(selectCurrentPage()).toInclude("you go right");
  expect(x).toBe(2);
});

test("options can be arrays of actions and return to the same node, with no next button", async () => {
  await createGraph(mazeNodes);
  await selectOptions()[2].action();
  expect(selectCurrentPage()).toInclude("you stay");
  expect(x).toBe(2);
  expect(selectOptions().length).toBe(5);
  expect(selectOptions()[0].label).toBe("left");
});

test("options with no node specified return to the same node", async () => {
  await createGraph(mazeNodes);
  await selectOptions()[3].action();
  expect(selectCurrentPage()).toInclude("stayPut");
  expect(x).toBe(1);
  expect(selectOptions().length).toBe(5);
  expect(selectOptions()[0].label).toBe("left");
});

test("options with no node specified return to the same node, with no next button", async () => {
  await createGraph(mazeNodes);
  await selectOptions()[4].action();
  expect(selectCurrentPage()).toInclude("No button");
  expect(selectOptions().length).toBe(5);
  expect(selectOptions()[0].label).toBe("left");
});

test("options can be null", async () => {
  await createGraph(nullOptionNodes);
  await selectOptions()[0].action();
  expect(selectCurrentPage()).toInclude("one");
});

test("options can be dynamic", async () => {
  x = "10";
  await createGraph(dynamicOptionsNodes);
  expect(selectOptions()[0].label).toBe("10");
});

test("optional options appear when condition is true", async () => {
  x = 1;
  await createGraph(optionalOptionsNodes);
  expect(selectOptions().length).toBe(2);
  expect(selectOptions()[0].label).toBe("one");
  expect(selectOptions()[1].label).toBe("two");
});

test("optional options do not appear when condition is false", async () => {
  await createGraph(optionalOptionsNodes);
  expect(selectOptions().length).toBe(1);
  expect(selectOptions()[0].label).toBe("one");
  x = 5;
  await createGraph(optionalOptionsNodes);
  expect(selectOptions().length).toBe(1);
  expect(selectOptions()[0].label).toBe("two");
});

test("options can explicitly exit the graph", async () => {
  await createGraph(exitOptionNodes);
  await selectOptions()[0].action();
  expect(selectOptions()).toBeNull();
});

test("options can specify a room to go to", async () => {
  await createGraph(roomOptionNodes);
  await selectOptions()[0].action();
  expect(selectOptions()).toBeNull();
  expect(selectCurrentPage()).toInclude("turret");
  expect(selectRoom()).toBe(room);
});