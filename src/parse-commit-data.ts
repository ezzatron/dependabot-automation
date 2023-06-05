export type ParsedCommitData = {
  ["updated-dependencies"]: UpdatedDependencyData[];
};

export function parseCommitData(data: unknown): ParsedCommitData {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Must be an object. Received ${typeOf(data)}.`);
  }

  if (!("updated-dependencies" in data)) {
    throw new Error("updated-dependencies is required.");
  }

  if (!Array.isArray(data["updated-dependencies"])) {
    throw new Error(
      "updated-dependencies must be an array. " +
        `Received ${typeOf(data["updated-dependencies"])}.`
    );
  }

  const updatedDependencies: UpdatedDependencyData[] = [];

  for (const dependency of data["updated-dependencies"]) {
    updatedDependencies.push(
      validateUpdatedDependencyData(updatedDependencies.length, dependency)
    );
  }

  return {
    ["updated-dependencies"]: updatedDependencies,
  };
}

function validateUpdatedDependencyData(
  position: number,
  data: unknown
): UpdatedDependencyData {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `updated-dependencies.${position} must be an object. ` +
        `Received ${typeOf(data)}.`
    );
  }

  if (!("dependency-name" in data)) {
    throw new Error(
      `updated-dependencies.${position}.dependency-name is required. `
    );
  }

  const dependencyName = data["dependency-name"];

  if (typeof dependencyName !== "string") {
    throw new Error(
      `updated-dependencies.${position}.dependency-name must be a string. ` +
        `Received ${typeOf(dependencyName)}.`
    );
  }

  if (!("dependency-type" in data)) {
    throw new Error(
      `updated-dependencies.${position}.dependency-type is required. `
    );
  }

  const dependencyType = data["dependency-type"];

  if (typeof dependencyType !== "string") {
    throw new Error(
      `updated-dependencies.${position}.dependency-type must be a string. ` +
        `Received ${typeOf(dependencyType)}.`
    );
  }

  return {
    ["dependency-name"]: dependencyName,
    ["dependency-type"]: dependencyType,
  };
}

function typeOf(data: unknown): string {
  let actual: string = typeof data;

  if (actual === "object") {
    if (data === null) {
      actual = "null";
    } else if (Array.isArray(data)) {
      actual = "array";
    }
  }

  return actual;
}

type UpdatedDependencyData = {
  ["dependency-name"]: string;
  ["dependency-type"]: string;
};
