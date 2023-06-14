import { errorMessage } from "./error.js";
import { isDependencyType } from "./guard/dependency-type.js";
import { isUpdateType } from "./guard/update-type.js";
import { parseYAML } from "./parse-yaml.js";
import { validate as validateCommitData } from "./schema/commit-data/validate.js";
import { DependencyType } from "./type/dependency-type.js";
import { UpdateType } from "./type/update-type.js";

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
    const dependencyName = dependency["dependency-name"];
    const dependencyType = dependency["dependency-type"];
    const updateType = dependency["update-type"];

    if (!isDependencyType(dependencyType)) {
      throw new Error(`Invalid dependency type: ${dependencyType}`);
    }

    if (updateType) {
      if (!isUpdateType(updateType)) {
        throw new Error(`Invalid update type: ${updateType}`);
      }

      updatedDependencies.push({
        dependencyName,
        dependencyType,
        updateType,
      } satisfies UpdatedDependency);
    } else {
      updatedDependencies.push({
        dependencyName,
        dependencyType,
        updateType: undefined,
      } satisfies UpdatedDependency);
    }
  }

  return { updatedDependencies };
}

export type ParsedCommitData = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: DependencyType;
  updateType: UpdateType | undefined;
};
