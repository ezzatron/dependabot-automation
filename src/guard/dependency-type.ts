import {
  DIRECT_DEVELOPMENT,
  DIRECT_PRODUCTION,
  INDIRECT,
} from "../constant/dependency-type.js";
import { DependencyType } from "../type/dependency-type.js";

export function isDependencyType(string: string): string is DependencyType {
  return (
    string === DIRECT_PRODUCTION ||
    string === DIRECT_DEVELOPMENT ||
    string === INDIRECT
  );
}
