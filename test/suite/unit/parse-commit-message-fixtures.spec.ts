import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  parseCommitMessage,
  ParsedCommitMessage,
} from "../../../src/parse-commit-message.js";

type Fixture = [
  string,
  {
    dependencyType: string;
    ecosystem: string;
    path: string;
  }
];

const fixturesPath = resolve(__dirname, "../../fixture/pr");
const fixtures: Fixture[] = [];

for (const entry of readdirSync(fixturesPath, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "failure") continue;

  const ecosystem = entry.name;
  const ecosystemPath = resolve(fixturesPath, ecosystem);

  for (const entry of readdirSync(ecosystemPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const dependencyType = entry.name;
    const dependencyTypePath = resolve(ecosystemPath, dependencyType);

    for (const entry of readdirSync(dependencyTypePath, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;

      const { name } = entry;

      fixtures.push([
        name,
        {
          dependencyType,
          ecosystem,
          path: resolve(dependencyTypePath, name),
        },
      ]);
    }
  }
}

describe("parseCommitMessage() — fixtures", () => {
  it.each(fixtures)(
    "should parse an update-type for each dependency (%s)",
    (_, { ecosystem, path }) => {
      const expectedJSON = readFileSync(resolve(path, "expected.json"));
      const expected = JSON.parse(
        expectedJSON.toString()
      ) as ParsedCommitMessage;

      const message = readFileSync(resolve(path, "commit-message"));
      const actual = parseCommitMessage(message.toString());

      expect(actual).toEqual(expected);
    }
  );
});
