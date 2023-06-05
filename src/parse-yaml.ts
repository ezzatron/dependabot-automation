import { load } from "js-yaml";
import { errorMessage } from "./error.js";

export function parseYAML(yaml: string): unknown {
  try {
    return load(yaml);
  } catch (error) {
    const message = errorMessage(error);
    const original = JSON.stringify(yaml);

    throw new Error(`Unable to parse YAML: ${message}. Content: ${original}`);
  }
}
