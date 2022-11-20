import "jest-extended/all";

jest.mock("seedrandom", () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});
