import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { initGame } from "../../gonorth";
import { initStore } from "../../redux/store";
import { newGame } from "../../redux/gameActions";
import { OptionGraph } from "./optionGraph";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { selectTurn } from "../../utils/selectors";
import { Verb } from "../verbs/verb";

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
  const graph = new OptionGraph(...speechNodes);
  await graph.commence().chain();
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
  const graph = new OptionGraph(...nodes);
  await graph.commence().chain();
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
