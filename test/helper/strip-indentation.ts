export function stripIndentation(string: string): string {
  const lines = string.split("\n");
  const firstLine = lines.find((line) => line !== "") ?? "";
  const indentation = firstLine.match(/^\s+/)?.[0] ?? "";

  return string.replace(new RegExp(`^${indentation}`, "gm"), "");
}
