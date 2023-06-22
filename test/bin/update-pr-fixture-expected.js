#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises";
import { basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parsePullRequest } from "../src/main.js";

const bin = basename(process.argv[1]);
const [, , fixtureName] = process.argv;

if (!fixtureName) {
  console.error(`usage: ${bin} <fixture-name>`);
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const fixturePath = resolve(__dirname, "../fixture/pr", fixtureName);
const branchNamePath = resolve(fixturePath, "branch-name");
const commitMessagePath = resolve(fixturePath, "commit-message");
const expectedPath = resolve(fixturePath, "expected.json");

const branch = (await readFile(branchNamePath)).toString().trim();
const commitMessage = (await readFile(commitMessagePath)).toString();
const result = parsePullRequest(branch, commitMessage);

await writeFile(expectedPath, JSON.stringify(result, null, 2) + "\n");
