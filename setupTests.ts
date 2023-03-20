import "jest-extended/all";

jest.mock("seedrandom", () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

jest.mock("./src/utils/consoleIO");
const consoleIO = require("./src/utils/consoleIO");
consoleIO.output = jest.fn();
consoleIO.showOptions = jest.fn();
