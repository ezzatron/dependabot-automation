import { parseCommitYAML } from "../../../src/parse-commit-yaml.js";
import { indented } from "../../helper/indented.js";
import { when } from "../../helper/jest-dsl.js";
import { wrapped } from "../../helper/wrapped.js";

const schemaViolations = [
  [
    wrapped`
      is not an object
      `,
    indented`
      []
      `,
    indented`
        - must be object
      `,
  ],
  [
    wrapped`
      is missing the updated-dependencies property
      `,
    indented`
      {}
      `,
    indented`
        - must have required property 'updated-dependencies'
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that is not an array
      `,
    indented`
      updated-dependencies: null
      `,
    indented`
        - must be array (/updated-dependencies)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item that is not an
      object
      `,
    indented`
      updated-dependencies:
      - []
      `,
    indented`
        - must be object (/updated-dependencies/0)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item that is missing
      the dependency-name property
      `,
    indented`
      updated-dependencies:
      - dependency-type: direct:production
      `,
    indented`
        - must have required property 'dependency-name' (/updated-dependencies/0)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with a
      dependency-name property that is not a string
      `,
    indented`
      updated-dependencies:
      - dependency-name: {}
        dependency-type: direct:production
      `,
    indented`
        - must be string (/updated-dependencies/0/dependency-name)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item that is missing
      the dependency-type property
      `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
      `,
    indented`
        - must have required property 'dependency-type' (/updated-dependencies/0)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with a
      dependency-type property that is not a string
    `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: 111
      `,
    indented`
        - must be string (/updated-dependencies/0/dependency-type)
        - must be one of "direct:production", "direct:development", "indirect" (/updated-dependencies/0/dependency-type)
      `,
  ],
  [
    wrapped`
      has an updated-dependencies property that contains an item with a
      dependency-type property that is not one of the allowed values
      `,
    indented`
      updated-dependencies:
      - dependency-name: coffee-rails
        dependency-type: invalid-type
      `,
    indented`
        - must be one of "direct:production", "direct:development", "indirect" (/updated-dependencies/0/dependency-type)
      `,
  ],
] as const;

describe("parseCommitYAML()", () => {
  let yaml: string;

  describe("validation", () => {
    when`
      the YAML fragment is not valid YAML
    `(() => {
      beforeEach(() => {
        yaml = indented`
          {
          `;
      });

      it("should throw", () => {
        expect(() => parseCommitYAML(yaml)).toThrow(
          "Invalid YAML fragment: Unable to parse YAML:"
        );
      });
    });

    describe.each(schemaViolations)(
      "when the YAML fragment %s",
      (_description, yaml, expectedErrors) => {
        it("should throw", () => {
          expect(() => parseCommitYAML(yaml)).toThrow(
            indented`
              Invalid YAML fragment:
              ${expectedErrors}
              `
          );
        });
      }
    );
  });

  when`
    the YAML fragment has a single updated dependency
  `(() => {
    beforeEach(() => {
      yaml = indented`
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
        `;
    });

    it("should parse the updated dependency", () => {
      expect(parseCommitYAML(yaml)).toMatchObject({
        updatedDependencies: [
          {
            dependencyName: "coffee-rails",
            dependencyType: "direct:production",
          },
        ],
      });
    });
  });

  when`
    the YAML fragment has multiple updated dependencies
  `(() => {
    beforeEach(() => {
      yaml = indented`
        updated-dependencies:
        - dependency-name: coffee-rails
          dependency-type: direct:production
          update-type: version-update:semver-minor
        - dependency-name: coffeescript
          dependency-type: indirect
          update-type: version-update:semver-patch
        `;
    });

    it("should parse the updated dependencies", () => {
      expect(parseCommitYAML(yaml)).toMatchObject({
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
