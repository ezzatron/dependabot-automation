import { createValidate } from "../validation.js";
import { ID } from "./schema.js";

export const validate = createValidate<Type>(ID, "commit data");

export type Type = {
  ["updated-dependencies"]: {
    ["dependency-name"]: string;
    ["dependency-type"]: string;
    ["update-type"]: string | undefined;
  }[];
};
