import { initGame } from "../../gonorth";
import { Item } from "../items/item";
import { Verb } from "../verbs/verb";
import { AutoAction } from "./autoAction";
import { Parser } from "./parser";

const mockParse = jest.fn(() => true);
jest.mock("./parser", () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parse: mockParse
  }))
}));

const mockedParser = jest.mocked(Parser);
beforeEach(() => mockedParser.mockClear());

initGame("test", "", { debugMode: false });

const ball = new Item("ball");
const context: Context = {
  verb: new Verb("boing"),
  item: ball
};

test("AutoAction does not trigger when the condition is not met", () => {
  const x = 1;
  const autoAction = new AutoAction.Builder()
    .withCondition(() => x < 1)
    .withInputs("do something")
    .build();
  autoAction.check(context);
  expect(Parser).not.toHaveBeenCalled();
});

test("AutoAction triggers when a boolean condition is met", () => {
  const autoAction = new AutoAction.Builder().withCondition(true).withInputs("do something").build();
  autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction triggers when a function condition is met", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(() => true)
    .withInputs("i")
    .build();
  autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("i");
});

test("AutoAction triggers when no condition is given", () => {
  const autoAction = new AutoAction.Builder().withInputs("do something").build();
  autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction triggers when an undefined condition is set", () => {
  const autoAction = new AutoAction.Builder().withCondition().withInputs("do something").build();
  autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction triggers when a function condition is met", () => {
  const autoAction = new AutoAction.Builder().withCondition(true).withInputs("do something").build();
  autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction is triggered with a dynamic input", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(true)
    .withInputs(() => "dynamic")
    .build();
  autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("dynamic");
});

test("AutoAction uses context when evaluating the condition", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(({ x }) => (x as number) > 0)
    .withInputs("do maths")
    .build();
  autoAction.check({ ...context, x: 1 });
  expect(Parser).toHaveBeenCalledWith("do maths");
});

test("AutoAction uses context when evaluating the input", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(true)
    .withInputs(({ item }) => `take ${item.name}`)
    .build();
  autoAction.check({ ...context, item: ball });
  expect(Parser).toHaveBeenCalledWith("take ball");
});

test("AutoAction performs several actions in sequence", async () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(true)
    .withInputs("take ball", "x ball", "put ball on floor")
    .build();
  await autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("take ball");
  expect(Parser).toHaveBeenCalledWith("x ball");
  expect(Parser).toHaveBeenCalledWith("put ball on floor");
});

test("AutoAction halts if an action isn't successful", async () => {
  mockParse.mockImplementationOnce(() => false); // Returning false indicates a failure.
  const autoAction = new AutoAction.Builder().withCondition(true).withInputs("contort face", "do starjumps").build();
  await autoAction.check(context);
  expect(Parser).toHaveBeenCalledWith("contort face");
  expect(Parser).not.toHaveBeenCalledWith("do starjumps");
});
