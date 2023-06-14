import {
  DIRECT_DEVELOPMENT,
  DIRECT_PRODUCTION,
  INDIRECT,
} from "../../constant/dependency-type.js";
import {
  SEMVER_MAJOR,
  SEMVER_MINOR,
  SEMVER_PATCH,
} from "../../constant/update-type.js";
import { PREFIX } from "../id.js";

export const ID = `${PREFIX}/commit-data.schema.json`;

const dependencyType = [DIRECT_PRODUCTION, DIRECT_DEVELOPMENT, INDIRECT];
const dependencyTypeList = dependencyType
  .map((t) => JSON.stringify(t))
  .join(", ");

const updateType = [SEMVER_MAJOR, SEMVER_MINOR, SEMVER_PATCH];
const updateTypeList = updateType.map((t) => JSON.stringify(t)).join(", ");

export const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: ID,
  title: "Dependabot commit message YAML fragment data",
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
            enum: dependencyType,
            errorMessage: {
              enum: `must be one of ${dependencyTypeList}`,
            },
          },
          "update-type": {
            description: "The type of update which will be performed.",
            type: "string",
            enum: updateType,
            errorMessage: {
              enum: `must be one of ${updateTypeList}`,
            },
          },
        },
      },
    },
  },
};
