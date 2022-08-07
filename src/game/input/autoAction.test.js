import { AutoAction } from "./autoAction";
import { Parser } from "./parser";

jest.mock("./parser", () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parse: jest.fn()
  }))
}));

test("AutoAction does not trigger when the condition is not met", () => {
  const x = 1;
  const autoAction = new AutoAction.Builder()
    .withCondition(() => x < 1)
    .withInputs("do something")
    .build();
  autoAction.check();
  expect(Parser).not.toHaveBeenCalled();
});

test("AutoAction triggers when a boolean condition is met", () => {
  const autoAction = new AutoAction.Builder().withCondition(true).withInputs("do something").build();
  autoAction.check();
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction triggers when a function condition is met", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(() => true)
    .withInputs("i")
    .build();
  autoAction.check();
  expect(Parser).toHaveBeenCalledWith("i");
});

test("AutoAction triggers when no condition is given", () => {
  const autoAction = new AutoAction.Builder().withInputs("do something").build();
  autoAction.check();
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction triggers when an undefined condition is set", () => {
  const autoAction = new AutoAction.Builder().withCondition().withInputs("do something").build();
  autoAction.check();
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction triggers when a function condition is met", () => {
  const autoAction = new AutoAction.Builder().withCondition(true).withInputs("do something").build();
  autoAction.check();
  expect(Parser).toHaveBeenCalledWith("do something");
});

test("AutoAction is triggered with a dynamic input", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(true)
    .withInputs(() => "dynamic")
    .build();
  autoAction.check();
  expect(Parser).toHaveBeenCalledWith("dynamic");
});

test("AutoAction uses context when evaluating the condition", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(({ x }) => x > 0)
    .withInputs("do maths")
    .build();
  autoAction.check({ x: 1 });
  expect(Parser).toHaveBeenCalledWith("do maths");
});

test("AutoAction uses context when evaluating the input", () => {
  const autoAction = new AutoAction.Builder()
    .withCondition(true)
    .withInputs(({ item }) => `take ${item}`)
    .build();
  autoAction.check({ item: "ball" });
  expect(Parser).toHaveBeenCalledWith("take ball");
});
