import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { initGame } from "../../gonorth";
import { initStore } from "../../redux/store";
import { newGame } from "../../redux/gameActions";
import { OptionGraph } from "./optionGraph";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";
import { selectTurn } from "../../utils/selectors";

expect.extend({
  toInclude(received, text) {
    const pass = received.includes(text);
    return {
      message: () =>
        `expected '${received}' ${pass ? "not " : ""}to contain '${text}'`,
      pass
    };
  }
});

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game, optionGraph, x;

const graph = {
  id: "alpha",
  actions: "goat",
  options: {
    one: {
      id: "beta",
      actions: "lamb",
      options: {
        three: {
          id: "gamma",
          actions: [() => x++, "sheep"]
        },
        four: {
          id: "delta",
          actions: "rabbit"
        }
      }
    },
    two: {
      id: "epsilon",
      actions: "falcon"
    },
    three: {
      id: "three",
      noEndTurn: true,
      actions: "bye"
    }
  }
};

const nodes = [
  { id: "cat", actions: "cat", options: { dog: "dog", sheep: "sheep" } },
  { id: "dog", actions: "dog", options: { cat: "cat", sheep: "sheep" } },
  { id: "sheep", actions: "sheep", options: { cat: "cat", dog: "dog" } }
];

beforeEach(async () => {
  unregisterStore();
  initStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", false);
  optionGraph = new OptionGraph(graph);
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
  expect(optionGraph.getNode("alpha")).toBe(graph);
  expect(optionGraph.getNode("beta")).toBe(graph.options.one);
  expect(optionGraph.getNode("gamma")).toBe(graph.options.one.options.three);
  expect(optionGraph.getNode("delta")).toBe(graph.options.one.options.four);
  expect(optionGraph.getNode("epsilon")).toBe(graph.options.two);
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

test("nodes can be referenced by id", async () => {
  const graph = new OptionGraph(...nodes);
  await graph.commence().chain();
  let option = selectOptions()[0];
  expect(option.label).toBe("dog");
  await option.action();
  option = selectOptions()[1];
  expect(option.label).toBe("sheep");
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
