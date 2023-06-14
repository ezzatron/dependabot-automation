import {
  REMOVAL,
  SEMVER_MAJOR,
  SEMVER_MINOR,
  SEMVER_PATCH,
} from "./constant/update-type.js";
import { errorMessage } from "./error.js";
import { ParsedCommitData, parseCommitData } from "./parse-commit-data.js";
import { DependencyType } from "./type/dependency-type.js";
import { UpdateType } from "./type/update-type.js";

const COMMIT_DATA_PATTERN = /^-{3}\n([\S|\s]*?)\n^\.{3}\n/m;
const UPDATE_TYPE_PATTERN =
  /^(Removes `.*`)$|^(?:Updates `.*`|Bumps \[.*) from (.*) to (.*?)\.?$|^Updates the requirements on .*(?:[\r\n]+- .*)*[\r\n]- \[Commits\].*\/compare\/(.*)\.{3}(.*)\)$/gm;

/**
 * Taken directly from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 *
 * Modified to allow for a "v" prefix
 */
const SEMVER_PATTERN =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

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

  const updateTypeMatches: RegExpExecArray[] = [];
  let updateTypeMatch: RegExpExecArray | null;

  while ((updateTypeMatch = UPDATE_TYPE_PATTERN.exec(message))) {
    updateTypeMatches.push(updateTypeMatch);
  }

  const updatedDependencies: UpdatedDependency[] = [];

  for (let i = 0; i < parsedData.updatedDependencies.length; ++i) {
    const dep = parsedData.updatedDependencies[i];
    let { dependencyName, dependencyType, updateType } = dep;

    if (!updateType && updateTypeMatches[i]) {
      const [
        ,
        removes,
        updatesFrom,
        updatesTo,
        requirementFrom,
        requirementTo,
      ] = updateTypeMatches[i];

      if (removes) {
        updateType = REMOVAL;
      } else if (updatesFrom && updatesTo) {
        updateType = determineUpdateType(updatesFrom, updatesTo);
      } else if (requirementFrom && requirementTo) {
        updateType = determineUpdateType(
          decodeURIComponent(requirementFrom),
          decodeURIComponent(requirementTo)
        );
      }
    }

    if (!updateType) updateType = undefined;

    updatedDependencies.push({ dependencyName, dependencyType, updateType });
  }

  return { updatedDependencies };
}

function determineUpdateType(from: string, to: string): UpdateType | undefined {
  const fromMatch = SEMVER_PATTERN.exec(from);
  if (!fromMatch) return undefined;

  const toMatch = SEMVER_PATTERN.exec(to);
  if (!toMatch) return undefined;

  const [, fromMajor, fromMinor, fromPatch] = fromMatch;
  const [, toMajor, toMinor, toPatch] = toMatch;

  if (parseInt(toMajor, 10) > parseInt(fromMajor, 10)) return SEMVER_MAJOR;
  if (parseInt(toMinor, 10) > parseInt(fromMinor, 10)) return SEMVER_MINOR;
  if (parseInt(toPatch, 10) > parseInt(fromPatch, 10)) return SEMVER_PATCH;

  return undefined;
}

export type ParsedCommitMessage = {
  updatedDependencies: UpdatedDependency[];
};

type UpdatedDependency = {
  dependencyName: string;
  dependencyType: DependencyType;
  updateType: UpdateType | undefined;
};
