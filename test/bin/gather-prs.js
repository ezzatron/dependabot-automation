#!/usr/bin/env node

/**
 * This script will gather a sampling of recent dependabot PRs from the public
 * GitHub API and write their PR body content, Dependabot commit message, and
 * branch name to files in the `test/fixture/pr` directory for use in testing
 * the parsing of Dependabot PRs.
 *
 * In order to ensure a broad coverage of PR types, the script will continue to
 * gather PRs from each ecosystem (npm, pip, etc.) until it has gathered at
 * least 10 PRs from each combination of ecosystem and dependency-type. It will
 * also gather multi-dependency PRs where possible.
 *
 * Since it's not possible to search for PRs for specific ecosystems or
 * dependency types directly, the script simply searches through all recent PRs
 * involving Dependabot and filters them by ecosystem and dependency type.
 */

import { mkdir, writeFile } from "fs/promises";
import { load } from "js-yaml";
import { Octokit } from "octokit";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const COMMIT_DATA_PATTERN = /^-{3}\n([\S|\s]*?)\n^\.{3}\n/m;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(__dirname, "../fixture/pr");

const ecosystems = [
  "bundler",
  "cargo",
  "composer",
  "docker",
  "github_actions",
  "go_modules",
  "gradle",
  "maven",
  "npm_and_yarn",
  "nuget",
  "pip",
  "submodules",
  "terraform",
];

const dependencyTypes = ["direct:production", "direct:development", "indirect"];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const counts = {};

  for (const ecosystem of ecosystems) {
    counts[ecosystem] = { multi: 0 };

    for (const dependencyType of dependencyTypes) {
      counts[ecosystem][dependencyType] = 0;
    }
  }

  // search for PRs by Dependabot
  const prs = octokit.paginate.iterator(
    octokit.rest.search.issuesAndPullRequests,
    {
      q: "is:pr involves:dependabot",
    }
  );

  // loop through each PR and determine the ecosystem and dependency type(s)
  let i = 0;
  outer: for await (const response of prs) {
    for (const prSummary of response.data) {
      // put a sane limit on how many PRs we'll process
      if (++i > 10000) {
        break outer;
      }

      const submitter = prSummary.user.login;

      // double-check that the PR is from Dependabot
      if (submitter !== "dependabot[bot]") {
        console.warn(
          `WARNING: Skipping PR ${prSlug} submitted by ${submitter}...`
        );
        continue;
      }

      // we don't get the owner or repo from the search results, so we have to
      // parse them from the prSummary.pull_request.url URL, which looks like
      // https://api.github.com/repos/<owner>/<repo>/pulls/<number>
      const prURL = new URL(prSummary.pull_request.url);
      const [, , owner, repo] = prURL.pathname
        .split("/")
        .map((s) => decodeURIComponent(s));
      const prSlug = `${owner}/${repo}#${prSummary.number}`;

      // get the full PR data
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prSummary.number,
      });
      const branch = pr.head.ref;

      // skip any non-standard branches
      if (!branch.startsWith("dependabot") || branch.length < 12) {
        console.warn(`WARNING: Skipping PR ${prSlug} for branch ${branch}...`);
        continue;
      }

      // get the commit data for the first commit on the PR branch
      const commits = await octokit.rest.pulls.listCommits({
        owner,
        repo,
        pull_number: prSummary.number,
        per_page: 1,
      });
      const commit = commits.data[0];

      // if there are no commits, skip to the next PR
      if (!commit) {
        console.warn(`WARNING: Skipping PR ${prSlug} with no commits...`);
        continue;
      }

      const commitAuthor = commit.author.login;
      const commitMessage = commit.commit.message;

      // skip unless the PR author is `dependabot[bot]`
      if (commitAuthor !== "dependabot[bot]") {
        console.warn(
          `WARNING: Skipping PR ${prSlug} authored by ${commitAuthor}...`
        );
        continue;
      }

      const ecosystem = getEcosystem(branch);
      const dependencyTypes = getDependencyTypes(commitMessage);

      // if no dependency types were found, write the commit message to a file
      // in a directory of parsing failures, then skip to the next PR
      if (dependencyTypes.length === 0) {
        console.warn(`Skipping PR ${prSlug} with bad data...`);

        await mkdir(resolve(fixtureDir, "failure"), { recursive: true });
        await writeFile(
          resolve(
            fixtureDir,
            "failure",
            `${slugify(owner)}-${slugify(repo)}-${pr.number}`
          ),
          commitMessage
        );

        continue;
      }

      const isMultiDependency = dependencyTypes.length > 1;
      const dependencyType = isMultiDependency ? "multi" : dependencyTypes[0];

      // if we encounter an unexpected ecosystem or dependency type, don't fail,
      // but warn so that the script can be updated
      if (!ecosystems.includes(ecosystem)) {
        console.warn(
          `WARNING: PR ${prSlug} has unexpected ecosystem ${ecosystem}`
        );

        if (!counts[ecosystem]) counts[ecosystem] = {};
      }
      if (!isMultiDependency && !dependencyTypes.includes(dependencyType)) {
        console.warn(
          `WARNING: PR ${prSlug} has unexpected dependency-type ${dependencyType}`
        );

        if (!counts[ecosystem][dependencyType]) {
          counts[ecosystem][dependencyType] = 0;
        }
      }

      // if we've already gathered enough PRs for this ecosystem and dependency
      // type, skip it
      if (counts[ecosystem][dependencyType] >= 10) {
        console.warn("...");
        continue;
      }

      // increment the appropriate PR count
      ++counts[ecosystem][dependencyType];

      // write the PR to a fixture
      await writeFixture(
        ecosystem,
        dependencyType,
        owner,
        repo,
        pr,
        commitMessage
      );

      // if we have enough PRs for ALL ecosystems and dependency types, we're
      // done
      if (
        Object.values(counts).every((counts) =>
          Object.values(counts).every((count) => count >= 10)
        )
      ) {
        console.log("All quotas met, done.");
        return;
      }
    }
  }
}

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
