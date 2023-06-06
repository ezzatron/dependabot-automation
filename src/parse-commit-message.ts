import { errorMessage } from "./error.js";
import { ParsedCommitData, parseCommitData } from "./parse-commit-data.js";

const COMMIT_DATA_PATTERN = /^-{3}\n([\S|\s]*?)\n^\.{3}\n/m;

export function parseCommitMessage(message: string): ParsedCommitMessage {
  const commitDataMatch = COMMIT_DATA_PATTERN.exec(message);

  if (!commitDataMatch) {
    throw new Error(
      "Unable to parse Dependabot commit message: Commit data not found."
    );
  }

  let parsedData: ParsedCommitData;

  try {
    parsedData = parseCommitData(commitDataMatch[1]);
  } catch (error) {
    const message = errorMessage(error);

    throw new Error(`Unable to parse Dependabot commit message: ${message}`);
  }

  const { updatedDependencies } = parsedData;

  return { updatedDependencies };
}

type ParsedCommitMessage = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: string;
};
