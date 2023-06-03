/** @type {import('jest').Config} */
const config = {
  collectCoverageFrom: ["<rootDir>/src/**", "!<rootDir>/src/type/**"],
  coverageDirectory: "artifacts/coverage/jest",
  projects: [
    {
      transformIgnorePatterns: [
        "signal-exit", // see https://github.com/facebook/jest/issues/9503#issuecomment-708507112
      ],
      moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
      },
      displayName: "unit",
      preset: "es-jest",
      testMatch: ["<rootDir>/test/suite/unit/**/*.spec.*"],
    },
  ],
};

export default config;
