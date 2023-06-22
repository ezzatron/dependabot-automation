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

import { Octokit } from "octokit";
import { dependencyTypes, ecosystems } from "./common/constant.js";
import { SkipError, writePullRequestFixture } from "./common/pr-fixture.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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

      // we don't get the owner or repo from the search results, so we have to
      // parse them from the prSummary.pull_request.url URL, which looks like
      // https://api.github.com/repos/<owner>/<repo>/pulls/<number>
      const prURL = new URL(prSummary.pull_request.url);
      const [, , owner, repo] = prURL.pathname
        .split("/")
        .map((s) => decodeURIComponent(s));
      const prSlug = `${owner}/${repo}#${prSummary.number}`;

      // double-check that the PR is from Dependabot
      if (submitter !== "dependabot[bot]") {
        console.warn(
          `WARNING: Skipping PR ${prSlug} submitted by ${submitter}...`
        );
        continue;
      }

      let writeResult;

      // write the PR to a fixture
      try {
        writeResult = await writePullRequestFixture(
          octokit,
          owner,
          repo,
          prSummary.number
        );
      } catch (error) {
        if (error instanceof SkipError) {
          console.warn(`WARNING: Skipping PR ${prSlug}: ${error.message}`);
          continue;
        }

        throw error;
      }

      const { ecosystem, isMultiDependency, dependencyType } = writeResult;

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
