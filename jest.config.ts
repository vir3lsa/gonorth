import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  setupFilesAfterEnv: ["jest-extended", "<rootDir>/setupTests.ts"],
  testPathIgnorePatterns: ["cypress"],
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "@items/(.*)": "<rootDir>/src/game/items/$1",
    "@interactions/(.*)": "<rootDir>/src/game/interactions/$1"
  }
};

export default jestConfig;
