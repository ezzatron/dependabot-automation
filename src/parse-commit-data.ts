import { errorMessage } from "./error.js";
import { parseYAML } from "./parse-yaml.js";
import { validate as validateCommitData } from "./schema/commit-data/validate.js";

export function parseCommitData(yaml: string): ParsedCommitData {
  let rawData: unknown;

  try {
    rawData = parseYAML(yaml);
  } catch (error) {
    const message = errorMessage(error);

    throw new Error(`Invalid commit data: ${message}`);
  }

  const data = validateCommitData(rawData);
  const updatedDependencies = [];

  for (const dependency of data["updated-dependencies"]) {
    updatedDependencies.push({
      dependencyName: dependency["dependency-name"],
      dependencyType: dependency["dependency-type"],
      updateType: dependency["update-type"],
    });
  }

  return { updatedDependencies };
}

export type ParsedCommitData = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: string;
  updateType: string | undefined;
};
