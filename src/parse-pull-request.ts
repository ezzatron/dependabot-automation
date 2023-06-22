import { parseBranchName } from "./parse-branch-name.js";
import { parseCommitMessage } from "./parse-commit-message.js";
import { DependencyType } from "./type/dependency-type.js";
import { UpdateType } from "./type/update-type.js";

export function parsePullRequest(
  branch: string,
  commitMessage: string
): ParsedPullRequest {
  const { updatedDependencies } = parseCommitMessage(commitMessage);
  const dependencyNames = updatedDependencies.map(({ dependencyName: n }) => n);
  const { ecosystem, directory } = parseBranchName(dependencyNames, branch);

  return { ecosystem, directory, updatedDependencies };
}

export type ParsedPullRequest = {
  ecosystem: string;
  directory: string;
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: DependencyType;
  updateType: UpdateType | undefined;
};
