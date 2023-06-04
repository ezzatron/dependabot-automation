type ParsedBranchName = {
  ecosystem: string;
  directory: string;
};

/**
 * Parse a Dependabot branch name to determine the ecosystem and directory.
 */
export function parseBranchName(
  dependencies: string[],
  branch: string
): ParsedBranchName {
  if (dependencies.length < 1) {
    throw new Error(
      "Unable to parse Dependabot branch name: " +
        "Dependency list must not be empty."
    );
  }

  if (!branch.startsWith("dependabot")) {
    const quotedBranch = JSON.stringify(branch);

    throw new Error(
      "Unable to parse Dependabot branch name: " +
        `Branch name ${quotedBranch} must start with "dependabot".`
    );
  }

  // count the delimiters in the dependency name
  const [firstDependency] = dependencies;
  const delimCount = firstDependency.split("/").length - 1;

  // multi-dependency branches have an extra segment
  let junkCount = delimCount;
  if (dependencies.length > 1) junkCount += 1;

  const parts = branch.split("/");
  const ecosystem = parts[1];
  const directory = "/" + parts.slice(2, -1 - junkCount).join("/");

  return { ecosystem, directory };
}
