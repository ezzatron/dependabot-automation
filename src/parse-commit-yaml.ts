import { errorMessage } from "./error.js";
import { parseYAML } from "./parse-yaml.js";
import { validate as validateFragment } from "./schema/commit-message-yaml-fragment/validate.js";

export function parseCommitYAML(yaml: string): ParsedCommitYAML {
  let yamlData: unknown;

  try {
    yamlData = parseYAML(yaml);
  } catch (error) {
    const message = errorMessage(error);

    throw new Error(`Invalid YAML fragment: ${message}`);
  }

  const data = validateFragment(yamlData);
  const updatedDependencies = [];

  for (const dependency of data["updated-dependencies"]) {
    updatedDependencies.push({
      dependencyName: dependency["dependency-name"],
      dependencyType: dependency["dependency-type"],
    });
  }

  return { updatedDependencies };
}

export type ParsedCommitYAML = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: string;
};
