import { errorMessage } from "./error.js";
import { parseYAML } from "./parse-yaml.js";
import {
  Type as Fragment,
  validate as validateFragment,
} from "./schema/commit-message-yaml-fragment/validate.js";

const YAML_PATTERN = /^-{3}\n([\S|\s]*?)\n^\.{3}\n/m;

export function parseCommitMessage(message: string): ParsedCommitMessage {
  const YAMLMatch = YAML_PATTERN.exec(message);

  if (!YAMLMatch) {
    throw new Error(
      "Unable to parse Dependabot commit message: YAML fragment not found."
    );
  }

  let yamlData: unknown;

  try {
    yamlData = parseYAML(YAMLMatch[1]);
  } catch (error) {
    const message = errorMessage(error);

    throw new Error(
      "Unable to parse Dependabot commit message: " +
        `Invalid YAML fragment: ${message}`
    );
  }

  let data: Fragment;

  try {
    data = validateFragment(yamlData);
  } catch (error) {
    const message = errorMessage(error);

    throw new Error(`Unable to parse Dependabot commit message: ${message}`);
  }

  const updatedDependencies = [];

  for (const dependency of data["updated-dependencies"]) {
    updatedDependencies.push({
      dependencyName: dependency["dependency-name"],
      dependencyType: dependency["dependency-type"],
    });
  }

  return { updatedDependencies };
}

type ParsedCommitMessage = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: string;
};
