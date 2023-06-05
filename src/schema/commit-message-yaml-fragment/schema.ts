export const ID =
  "https://ghalactic.github.io/dependabot-automation/schema/commit-message-yaml-fragment.schema.json";

const dependencyTypes = ["direct:production", "direct:development", "indirect"];
const dependencyTypeList = dependencyTypes
  .map((t) => JSON.stringify(t))
  .join(", ");

export const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: ID,
  title: "Dependabot commit message YAML fragment",
  description: "Details of the dependencies updated by a Dependabot commit.",
  type: "object",
  required: ["updated-dependencies"],
  properties: {
    "updated-dependencies": {
      description:
        "The dependencies which will be updated if the commit is merged.",
      type: "array",
      items: {
        description: "A dependency which will be updated.",
        type: "object",
        required: ["dependency-name", "dependency-type"],
        properties: {
          "dependency-name": {
            description: "The name of the dependency.",
            type: "string",
            minLength: 1,
          },
          "dependency-type": {
            description: "The type of the dependency.",
            type: "string",
            enum: dependencyTypes,
            errorMessage: {
              enum: `must be one of ${dependencyTypeList}`,
            },
          },
        },
      },
    },
  },
};
