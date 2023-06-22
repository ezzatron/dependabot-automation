import { mkdir, writeFile } from "fs/promises";
import { load } from "js-yaml";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const COMMIT_DATA_PATTERN = /^-{3}\n([\S|\s]*?)\n^\.{3}\n/m;

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(__dirname, "../../fixture/pr");

export async function writePullRequestFixture(
  octokit,
  owner,
  repo,
  pullNumber
) {
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });
  const branch = pr.head.ref;

  // skip any non-standard branches
  if (!branch.startsWith("dependabot") || branch.length < 12) {
    throw new SkipError(`Non-Dependabot branch ${branch}`);
  }

  // get the commit data for the first commit on the PR branch
  const commits = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number: pr.number,
    per_page: 1,
  });
  const commit = commits.data[0];

  // if there are no commits, skip to the next PR
  if (!commit) throw new SkipError("No commits");

  const commitAuthor = commit.author.login;
  const commitMessage = commit.commit.message;

  // skip unless the PR author is `dependabot[bot]`
  if (commitAuthor !== "dependabot[bot]") {
    throw new SkipError(`Authored by ${commitAuthor}`);
  }

  const ecosystem = getEcosystem(branch);
  const dependencyTypes = getDependencyTypes(commitMessage);

  // if no dependency types were found, write the commit message to a file
  // in a directory of parsing failures, then skip to the next PR
  if (dependencyTypes.length === 0) {
    await mkdir(resolve(fixtureDir, "failure"), { recursive: true });
    await writeFile(
      resolve(
        fixtureDir,
        "failure",
        `${slugify(owner)}-${slugify(repo)}-${pr.number}`
      ),
      commitMessage
    );

    throw new SkipError("Bad data");
  }

  const isMultiDependency = dependencyTypes.length > 1;
  const dependencyType = isMultiDependency ? "multi" : dependencyTypes[0];

  // write the PR to a fixture
  await writeFixture(ecosystem, dependencyType, owner, repo, pr, commitMessage);

  return { ecosystem, isMultiDependency, dependencyType };
}

export class SkipError extends Error {}

/**
 * Parse the PR branch name to determine the ecosystem.
 *
 * Dependabot branches are named like `dependabot/npm_and_yarn/...`, but can
 * use alternate delimiters.
 */
function getEcosystem(branch) {
  const delimiter = branch[10]; // the character after "dependabot"

  return branch.split(delimiter)[1];
}

function getDependencyTypes(commitMessage) {
  const commitDataMatch = COMMIT_DATA_PATTERN.exec(commitMessage);

  if (!commitDataMatch) return [];

  try {
    const data = load(commitDataMatch[1]);
    let dependencyTypes = [];

    for (const updated of data["updated-dependencies"] ?? []) {
      if (updated["dependency-type"]) {
        dependencyTypes.push(updated["dependency-type"]);
      }
    }

    return dependencyTypes;
  } catch {}

  return [];
}

/**
 * Write a PR to the fixtures directory.
 *
 * The fixtures will be organized by ecosystem and dependency type, and will be
 * placed in directories like `<ecosystem>/<dependency-type>/<org>-<repo>-<id>`.
 *
 * The PR body, commit message, and branch name will be written to files named
 * `pr-body`, `commit-message`, and `branch-name` respectively. The rest of the
 * PR data will be discarded.
 */
async function writeFixture(
  ecosystem,
  dependencyType,
  owner,
  repo,
  pr,
  commitMessage
) {
  const name = [
    slugify(ecosystem),
    slugify(dependencyType),
    `${slugify(owner)}-${slugify(repo)}-${pr.number}`,
  ].join("/");

  console.log(`Writing ${name} fixture...`);

  // strip trailing whitespace and add a newline
  const branchName = pr.head.ref.replaceAll(/[ \t]+$/gm, "") + "\n";
  const message = commitMessage.replaceAll(/[ \t]+$/gm, "") + "\n";
  const prBody = pr.body.replaceAll(/[ \t]+$/gm, "") + "\n";

  const dir = resolve(fixtureDir, name);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, "branch-name"), branchName);
  await writeFile(resolve(dir, "commit-message"), message);
  await writeFile(resolve(dir, "pr-body"), prBody);
}

function slugify(string) {
  return string
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
