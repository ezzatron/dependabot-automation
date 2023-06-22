import { parsePullRequest } from "../../../src/parse-pull-request.js";
import { indented } from "../../helper/indented.js";
import { when } from "../../helper/jest-dsl.js";

describe("parsePullRequest()", () => {
  let branch: string;
  let commitMessage: string;

  when`
    the pull request contains a single updated dependency
  `(() => {
    beforeEach(() => {
      branch = "dependabot/npm_and_yarn/api/types/react-dom-18.0.11";
      commitMessage = indented`
        <commit subject line>

        Bumps [@types/react-dom](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/react-dom) from 18.0.10 to 18.0.11.
        - [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
        - [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/react-dom)

        ---
        updated-dependencies:
        - dependency-name: "@types/react-dom"
          dependency-type: direct:development
          update-type: version-update:semver-patch
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
        `;
    });

    it("should parse the pull request", () => {
      expect(parsePullRequest(branch, commitMessage)).toMatchObject({
        ecosystem: "npm_and_yarn",
        directory: "/api",
        updatedDependencies: [
          {
            dependencyName: "@types/react-dom",
            dependencyType: "direct:development",
            updateType: "version-update:semver-patch",
          },
        ],
      });
    });
  });

  when`
    the pull request contains multiple updated dependencies
  `(() => {
    beforeEach(() => {
      branch = "dependabot/npm_and_yarn/api/jest-and-types/types/jest-29.4.2";
      commitMessage = indented`
        <commit subject line>

        Bumps [@types/jest](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/jest) and [jest](https://github.com/facebook/jest/tree/HEAD/packages/jest). These dependencies needed to b>

        Updates \`@types/jest\` from 29.2.5 to 29.4.0
        - [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
        - [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/jest)

        Updates \`jest\` from 29.3.1 to 29.4.2
        - [Release notes](https://github.com/facebook/jest/releases)
        - [Changelog](https://github.com/facebook/jest/blob/main/CHANGELOG.md)
        - [Commits](https://github.com/facebook/jest/commits/v29.4.2/packages/jest)

        ---
        updated-dependencies:
        - dependency-name: "@types/jest"
          dependency-type: direct:development
          update-type: version-update:semver-minor
        - dependency-name: jest
          dependency-type: direct:development
          update-type: version-update:semver-minor
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
        `;
    });

    it("should parse the pull request", () => {
      expect(parsePullRequest(branch, commitMessage)).toMatchObject({
        ecosystem: "npm_and_yarn",
        directory: "/api",
        updatedDependencies: [
          {
            dependencyName: "@types/jest",
            dependencyType: "direct:development",
            updateType: "version-update:semver-minor",
          },
          {
            dependencyName: "jest",
            dependencyType: "direct:development",
            updateType: "version-update:semver-minor",
          },
        ],
      });
    });
  });
});
