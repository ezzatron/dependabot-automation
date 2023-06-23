#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import { dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { dependencyTypes, updateTypes } from "./common/constant.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");
const fixtureDir = resolve(__dirname, "../fixture/pr");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  for (const entry of await readdir(fixtureDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const ecosystemDir = resolve(fixtureDir, entry.name);

    for (const entry of await readdir(ecosystemDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "failure") continue;

      const dependencyTypeDir = resolve(ecosystemDir, entry.name);

      for (const entry of await readdir(dependencyTypeDir, {
        withFileTypes: true,
      })) {
        if (!entry.isDirectory()) continue;

        const expectedPath = resolve(
          dependencyTypeDir,
          entry.name,
          "expected.json"
        );
        const expectedJSON = await readFile(expectedPath);
        const { directory, updatedDependencies } = JSON.parse(
          expectedJSON.toString()
        );

        const notableReasons = [];

        // if (directory !== "/") notableReasons.push("non-root directory");
        // if (updatedDependencies.length > 1) {
        //   notableReasons.push("multi-dependency");
        // }

        for (const { dependencyType, updateType } of updatedDependencies) {
          if (!dependencyTypes.includes(dependencyType)) {
            notableReasons.push(
              `dependency type ${JSON.stringify(dependencyType)}`
            );
          }

          if (updateType) {
            if (!updateTypes.includes(updateType)) {
              notableReasons.push(`update type ${JSON.stringify(updateType)}`);
            }
          } else {
            notableReasons.push("no update type");
          }
        }

        if (notableReasons.length < 1) continue;

        const relativePath = relative(rootDir, expectedPath);

        console.log(relativePath);
        notableReasons.forEach((r) => {
          console.log(`  - ${r}`);
        });
      }
    }
  }
}
