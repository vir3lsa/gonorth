import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  setupFilesAfterEnv: ["jest-extended", "<rootDir>/setupTests.ts"],
  testPathIgnorePatterns: ["cypress"],
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  roots: ["<rootDir>"]
};

export default jestConfig;
