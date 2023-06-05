export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown cause";
}

export function errorStack(error: unknown): string {
  return (error instanceof Error ? error.stack : undefined) ?? "unknown cause";
}
