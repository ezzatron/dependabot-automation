#!/usr/bin/env node

import { Octokit } from "octokit";
import { basename } from "path";
import { SkipError, writePullRequestFixture } from "./common/pr-fixture.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const [, script, owner, repo, pullNumber] = process.argv;
  const scriptName = basename(script);

  if (!owner || !repo || !pullNumber) {
    console.error(`usage: ${scriptName} <owner> <repo> <pull-number>`);
    process.exit(1);
  }

  const prSlug = `${owner}/${repo}#${pullNumber}`;

  try {
    await writePullRequestFixture(
      octokit,
      owner,
      repo,
      parseInt(pullNumber, 10)
    );
  } catch (error) {
    if (error instanceof SkipError) {
      console.error(`Skipping ${prSlug}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`Wrote ${prSlug} to fixtures`);
}
