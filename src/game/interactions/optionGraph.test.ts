import { unregisterStore } from "../../redux/storeRegistry";
import { initGame } from "../../gonorth";
import { OptionGraph } from "./optionGraph";
import { selectCurrentPage, selectImage, selectOptions } from "../../utils/testSelectors";
import { selectRoom, selectTurn, selectInventory } from "../../utils/selectors";
import { Verb } from "../verbs/verb";
import { Room } from "../items/room";
import { Item } from "../items/item";
import { clearPage } from "../../utils/sharedFunctions";

jest.mock("../../utils/consoleIO");
const consoleIO = require("../../utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();

let game: Game, optionGraph: OptionGraphT, x: number, doIt: VerbT;

const graphNodes = [
  {
    id: "alpha",
    actions: "goat",
    options: { one: "beta", two: "epsilon", three: "three", four: "four" }
  },
  { id: "beta", actions: "lamb", options: { three: "gamma", four: "delta" } },
  { id: "epsilon", actions: "falcon" },
  { id: "three", noEndTurn: true, actions: "bye" },
  {
    id: "four",
    actions: () => {
      doIt.attempt();
    }
  },
  {
    id: "gamma",
    actions: [() => x++, "sheep"]
  },
  {
    id: "delta",
    actions: "rabbit"
  }
];

const speechNodes: GraphNode[] = [
  {
    id: "hello",
    actions: "hello",
    options: { question: "question", compliment: "compliment", bye: "bye" }
  },
  {
    id: "question",
    actions: "question",
    options: { question: "question", compliment: "compliment", bye: "bye", exit: { actions: "Exiting.", exit: true } }
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

const skipActionsNodes = [
  {
    id: "start",
    actions: "test",
    options: {
      one: { node: "end", skipNodeActions: true }
    }
  },
  {
    id: "end",
    actions: "do not print",
    options: {
      badger: { actions: "badger" }
    }
  }
];

const inventoryNodes: GraphNode[] = [
  {
    id: "start",
    actions: ["inventory test"],
    options: {
      "use item": { inventoryAction: (item: ItemT) => `Using ${item.name}.` }
    }
  }
];

let room: RoomT, roomOptionNodes: GraphNode[];

const setupRoomOptionNodes = () => {
  room = new Room("room", "turret");
  roomOptionNodes = [
    {
      id: "start",
      actions: "test",
      options: { one: { actions: () => x++, room } }
    }
  ];
};

let graph: OptionGraph;

const createGraph = (nodes: GraphNode[]) => {
  graph = new OptionGraph("test", ...nodes);
  return graph.commence().chain();
};

beforeEach(async () => {
  unregisterStore();

  // Pretend we're in the browser
  game = initGame("Jolly Capers", "", { debugMode: false });
  optionGraph = new OptionGraph("jollyCapers", ...graphNodes);
  doIt = new Verb("do it", true, () => x++);
  x = 0;
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
  expect(optionGraph.isRunning()).toBe(true);
  await selectOptions()[1].action();
  expect(selectOptions()).toBeUndefined();
  expect(optionGraph.isRunning()).toBe(false);
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
  expect(selectOptions()).toBeUndefined();
  expect(optionGraph.isRunning()).toBe(false);
});

test("optionGraph repeats nodes by default", async () => {
  await createGraph(speechNodes);
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(4);
  expect(selectOptions()[0].label).toBe("question");
});

test("optionGraph does not repeat nodes if instructed", async () => {
  const graph = new OptionGraph("noRepeat", ...speechNodes);
  graph.allowRepeats = false;
  await graph.commence().chain();
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(3);
  expect(selectOptions()[0].label).not.toBe("question");
});

test("individual nodes can opt to not repeat", async () => {
  const nodes = [...speechNodes];
  nodes[1].allowRepeats = false;
  await createGraph(nodes);
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(3);
  expect(selectOptions()[0].label).not.toBe("question");
});

test("individual nodes can opt to repeat", async () => {
  const nodes = [...speechNodes];
  nodes[1].allowRepeats = true;
  const graph = new OptionGraph("repeats", ...nodes);
  graph.allowRepeats = false;
  await graph.commence().chain();
  await selectOptions()[0].action();
  expect(selectOptions().length).toBe(4);
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
  x = 10;
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
  expect(selectOptions()).toBeUndefined();
  expect(graph.isRunning()).toBe(false);
});

test("options can specify a room to go to", async () => {
  setupRoomOptionNodes();
  await createGraph(roomOptionNodes);
  await selectOptions()[0].action();
  expect(selectOptions()).toBeUndefined();
  expect(selectCurrentPage()).toInclude("turret");
  expect(selectRoom()).toBe(room);
  expect(graph.isRunning()).toBe(false);
});

test("options can choose not to perform the actions of linked nodes", async () => {
  await createGraph(skipActionsNodes);
  await selectOptions()[0].action();
  expect(selectCurrentPage()).toInclude("test");
  expect(selectCurrentPage()).not.toInclude("do not print");
  expect(selectOptions()[0].label).toBe("badger");
});

const setUpInventoryNodesTest = async () => {
  selectInventory().addItem(new Item("bucket"));
  selectInventory().addItem(new Item("spade"));
  await createGraph(inventoryNodes);
  return selectOptions()[0].action();
};

test("options can ask the player to choose from their inventory items", async () => {
  await setUpInventoryNodesTest();
  expect(selectCurrentPage()).toInclude("Use which item?");
  expect(selectOptions()[0].label).toBe("bucket");
  expect(selectOptions()[1].label).toBe("spade");
});

test("inventory options perform the expected action with the item in question", async () => {
  await setUpInventoryNodesTest();
  selectOptions()[1].action();
  expect(selectCurrentPage()).toInclude("Using spade.");
});

test("the previous node is returned to after an inventory action, without actions being performed", async () => {
  let x = 0;
  (inventoryNodes[0].actions as Action[]).unshift(() => x++);
  await setUpInventoryNodesTest();
  await selectOptions()[1].action();
  expect(x).toBe(1); // Action has been performed once, not twice.
  expect(selectOptions()[0].label).toBe("use item");
});

test("can be resumed", async () => {
  await createGraph(speechNodes);

  // Switch node and then exit.
  await selectOptions()[0].action();
  await selectOptions()[3].action();
  expect(graph.isRunning()).toBe(false);

  // Start the OptionGraph again and we should be at the same node.
  clearPage();
  await graph.resume().chain();
  expect(graph.isRunning()).toBe(true);
  expect(selectCurrentPage()).not.toInclude("hello");
  expect(selectCurrentPage()).toInclude("question");
});

test("can be made non-resumable", async () => {
  const nrGraph = new OptionGraph.Builder("nr")
    .isResumable(false)
    .withNodes(...speechNodes)
    .build();
  await nrGraph.commence().chain();
  await selectOptions()[0].action();
  await selectOptions()[3].action();
  expect(() => nrGraph.resume()).toThrow("Attempted to resume non-resumable OptionGraph 'nr'");
});

test("can be built with a builder a node at a time", () => {
  const graphy = new OptionGraph.Builder("graphy")
    .withNode(new OptionGraph.NodeBuilder("1"))
    .withNode(new OptionGraph.NodeBuilder("2"))
    .withNodes(
      new OptionGraph.NodeBuilder("3"),
      new OptionGraph.NodeBuilder("4")
    )
    .build();
  expect(graphy.getNode("1").id).toBe("1");
  expect(graphy.getNode("2").id).toBe("2");
  expect(graphy.getNode("3").id).toBe("3");
  expect(graphy.getNode("4").id).toBe("4");
});

test("options can be build with a builder", () => {
  const graph = new OptionGraph.Builder("gr1")
    .withNode(
      new OptionGraph.NodeBuilder("1").withOption(
        new OptionGraph.OptionBuilder("a")
          .withAction("b")
          .exit()
          .skipNodeActions()
          .withCondition(() => true)
          .withInventoryAction(() => "")
          .withNode("")
      )
    )
    .build();
  expect(graph.getNode("1").options).toBeDefined();
  const options = graph.getNode("1").options as GraphOptions;
  const option = options["a"] as GraphOption;
  expect(option.actions).toBe("b");
  expect(option.exit).toBe(true);
  expect(option.skipNodeActions).toBe(true);
  expect(option.condition).toBeDefined();
  expect(option.inventoryAction).toBeDefined();
  expect(option.node).toBe("");
});

test("options can be added with a label and a builder", () => {
  const graph = new OptionGraph.Builder("gr2")
    .withNode(
      new OptionGraph.NodeBuilder("1").withOption(
        "a",
        new OptionGraph.OptionBuilder().withNode("c")
      )
    )
    .build();
  const options = graph.getNode("1").options as GraphOptions;
  const option = options["a"] as GraphOption;
  expect(option).toBeDefined();
  expect(option.node).toBe("c");
});

describe("images", () => {
  let iGraph: OptionGraph;

  beforeEach(() => {
    iGraph = new OptionGraph.Builder("i")
      .withImage("test-image")
      .withNodes(...speechNodes)
      .build();
  });

  test("shows image whilst active", async () => {
    await iGraph.commence().chain();
    expect(selectImage()).toBe("test-image");

    // Image should be replaced after leaving the graph via an optionless node.
    await selectOptions()[2].action();
    expect(selectImage()).toBeUndefined();
  });

  test("removes image when selecting exit node", async () => {
    await iGraph.commence().chain();
    await selectOptions()[0].action();
    await selectOptions()[3].action();
    expect(selectImage()).toBeUndefined();
  });
});
