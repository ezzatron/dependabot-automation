import * as dependencyType from "../constant/dependency-type.js";

export type DependencyType =
  (typeof dependencyType)[keyof typeof dependencyType];
