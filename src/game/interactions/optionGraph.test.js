import { getStore, unregisterStore } from "../../redux/storeRegistry";
import { initGame } from "../../gonorth";
import { initStore } from "../../redux/store";
import { newGame } from "../../redux/gameActions";
import { OptionGraph } from "./optionGraph";
import { selectCurrentPage, selectOptions } from "../../utils/testSelectors";

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
    }
  }
};

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
  expect(optionGraph.getNode("alpha")).toBe(optionGraph.graph);
  expect(optionGraph.getNode("beta")).toBe(optionGraph.graph.options.one);
  expect(optionGraph.getNode("gamma")).toBe(
    optionGraph.graph.options.one.options.three
  );
  expect(optionGraph.getNode("delta")).toBe(
    optionGraph.graph.options.one.options.four
  );
  expect(optionGraph.getNode("epsilon")).toBe(optionGraph.graph.options.two);
});
