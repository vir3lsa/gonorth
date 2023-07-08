import { initGame, Item } from "../../gonorth";
import { Verb } from "../verbs/verb";
import { checkAutoActions } from "./autoActionExecutor";

const mock1 = jest.fn();
const mock2 = jest.fn();
const mock3 = jest.fn();

initGame("test", "", { debugMode: false });

jest.mock("../../utils/selectors", () => ({
  selectAllItemNames: () => new Set(),
  selectRecordChanges: () => false,
  selectAutoActions: jest.fn(() => [
    {
      check: (({ verb }) => {
        if (verb.name === "put") {
          mock1();
          return false;
        }

        return true;
      }) as (context: Context) => Boolean
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
  const result = await checkAutoActions({ verb: new Verb("take"), item: new Item("taken") });
  expect(result).toBe(true);
  expect(mock1).not.toHaveBeenCalled();
  expect(mock2).not.toHaveBeenCalled();
  expect(mock3).toHaveBeenCalled();
});

test("returns false and halts when an action fails", async () => {
  const result = await checkAutoActions({ verb: new Verb("put"), item: new Item("placed") });
  expect(result).toBe(false);
  expect(mock1).toHaveBeenCalled();
  expect(mock2).not.toHaveBeenCalled();
  expect(mock3).not.toHaveBeenCalled();
});
