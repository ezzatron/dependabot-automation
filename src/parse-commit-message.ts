import { errorMessage } from "./error.js";
import { ParsedCommitYAML, parseCommitYAML } from "./parse-commit-yaml.js";

const YAML_PATTERN = /^-{3}\n([\S|\s]*?)\n^\.{3}\n/m;

export function parseCommitMessage(message: string): ParsedCommitMessage {
  const YAMLMatch = YAML_PATTERN.exec(message);

  if (!YAMLMatch) {
    throw new Error(
      "Unable to parse Dependabot commit message: YAML fragment not found."
    );
  }

  let parsedYAML: ParsedCommitYAML;

  try {
    parsedYAML = parseCommitYAML(YAMLMatch[1]);
  } catch (error) {
    const message = errorMessage(error);

    throw new Error(`Unable to parse Dependabot commit message: ${message}`);
  }

  const { updatedDependencies } = parsedYAML;

  return { updatedDependencies };
}

type ParsedCommitMessage = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: string;
};
