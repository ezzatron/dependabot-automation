import { parseCommitMessage } from "../../../src/parse-commit-message.js";
import { stripIndentation } from "../../helper/strip-indentation.js";

describe("parseCommitMessage()", () => {
  let message: string;

  describe("validation", () => {
    describe("when the message does not contain a YAML fragment", () => {
      beforeEach(() => {
        message = "Bumps coffee-rails from 4.0.1 to 4.2.2.";
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: Not found."
        );
      });
    });

    describe("when the message contains a YAML fragment that is not valid YAML", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          {
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: Unable to parse YAML:"
        );
      });
    });

    describe("when the message contains a YAML fragment that is not an object", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          []
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: Must be an object. Received array."
        );
      });
    });

    describe("when the message contains a YAML fragment that is missing the updated-dependencies property", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          other: null
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies is required"
        );
      });
    });

    describe("when the message contains a YAML fragment with an updated-dependencies property that is not an array", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies: null
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies must be an array. Received null."
        );
      });
    });

    describe("when the message contains a YAML fragment with an updated-dependencies property that contains an item that is not an object", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies:
          - coffee-rails
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies.0 must be an object. Received string."
        );
      });
    });

    describe("when the message contains a YAML fragment with an updated-dependencies property that contains an item that is missing the dependency-name property", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies:
          - dependency-type: direct:production
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies.0.dependency-name is required"
        );
      });
    });

    describe("when the message contains a YAML fragment with an updated-dependencies property that contains an item with a dependency-name property that is not a string", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies:
          - dependency-name: {}
            dependency-type: direct:production
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies.0.dependency-name must be a string. Received object."
        );
      });
    });

    describe("when the message contains a YAML fragment with an updated-dependencies property that contains an item that is missing the dependency-type property", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies:
          - dependency-name: coffee-rails
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies.0.dependency-type is required"
        );
      });
    });

    describe("when the message contains a YAML fragment with an updated-dependencies property that contains an item with a dependency-type property that is not a string", () => {
      beforeEach(() => {
        message = stripIndentation(`
          Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
          - [Release notes](https://github.com/rails/coffee-rails/releases)
          - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
          - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

          ---
          updated-dependencies:
          - dependency-name: coffee-rails
            dependency-type: 111
          ...

          Signed-off-by: dependabot[bot] <support@github.com>
        `);
      });

      it("should throw", () => {
        expect(() => parseCommitMessage(message)).toThrow(
          "Unable to parse Dependabot commit message: YAML fragment: updated-dependencies.0.dependency-type must be a string. Received number."
        );
      });
    });
  });

  describe("when the message contains a YAML fragment with a single dependency", () => {
    beforeEach(() => {
      message = stripIndentation(`
        Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
        - [Release notes](https://github.com/rails/coffee-rails/releases)
        - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
        - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

        ---
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
      `);
    });

    it("should parse the updated dependency", () => {
      expect(parseCommitMessage(message)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "coffee-rails",
            dependencyType: "direct:production",
          },
        ],
      });
    });
  });

  describe("when the message contains a YAML fragment with multiple dependencies", () => {
    beforeEach(() => {
      message = stripIndentation(`
        Bumps [coffee-rails](https://github.com/rails/coffee-rails) from 4.0.1 to 4.2.2.
        - [Release notes](https://github.com/rails/coffee-rails/releases)
        - [Changelog](https://github.com/rails/coffee-rails/blob/master/CHANGELOG.md)
        - [Commits](rails/coffee-rails@v4.0.1...v4.2.2)

        ---
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
          update-type: version-update:semver-minor
        - dependency-name: coffeescript
          dependency-type: indirect
          update-type: version-update:semver-patch
        ...

        Signed-off-by: dependabot[bot] <support@github.com>
      `);
    });

    it("should parse the updated dependencies", () => {
      expect(parseCommitMessage(message)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "coffee-rails",
            dependencyType: "direct:production",
          },
          {
            dependencyName: "coffeescript",
            dependencyType: "indirect",
          },
        ],
      });
    });
  });
});
