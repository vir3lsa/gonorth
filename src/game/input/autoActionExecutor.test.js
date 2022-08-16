import { checkAutoActions } from "./autoActionExecutor";

const mock1 = jest.fn();
const mock2 = jest.fn();
const mock3 = jest.fn();

jest.mock("../../utils/selectors", () => ({
  selectAutoActions: jest.fn(() => [
    {
      check: ({ verb }) => {
        if (verb.name === "put") {
          mock1();
          return false;
        }

        return true;
      }
    },
    {
      check: ({ verb }) => {
        if (verb.name === "put") {
          mock2();
        }

        return true;
      }
    },
    {
      check: ({ verb }) => {
        if (verb.name === "take") {
          mock3();
        }

        return true;
      }
    }
  ])
}));

beforeEach(() => {
  mock1.mockClear();
  mock2.mockClear();
  mock3.mockClear();
});

test("matching auto actions are executed", async () => {
  const result = await checkAutoActions({ verb: { name: "take" } });
  expect(result).toBe(true);
  expect(mock1).not.toHaveBeenCalled();
  expect(mock2).not.toHaveBeenCalled();
  expect(mock3).toHaveBeenCalled();
});

test("returns false and halts when an action fails", async () => {
  const result = await checkAutoActions({ verb: { name: "put" } });
  expect(result).toBe(false);
  expect(mock1).toHaveBeenCalled();
  expect(mock2).not.toHaveBeenCalled();
  expect(mock3).not.toHaveBeenCalled();
});
