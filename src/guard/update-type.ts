import {
  SEMVER_MAJOR,
  SEMVER_MINOR,
  SEMVER_PATCH,
} from "../constant/update-type.js";
import { UpdateType } from "../type/update-type.js";

export function isUpdateType(string: string): string is UpdateType {
  return (
    string === SEMVER_MAJOR ||
    string === SEMVER_MINOR ||
    string === SEMVER_PATCH
  );
}
