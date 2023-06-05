/**
 * An imitation of Swift's multiline string literals.
 *
 * The tagged template literal can be indented to match the surrounding code.
 * The whitespace before the closing backtick (`) determines what whitespace to
 * ignore before all of the other lines. However, if you write whitespace at the
 * beginning of a line in addition to what’s before the closing backtick, that
 * whitespace is included.
 */
export function indented([string]: TemplateStringsArray): string {
  const lines = string.split("\n");
  const firstLine = lines[0];
  const lastLine = lines[lines.length - 1];

  if (firstLine !== "") {
    throw new Error("The first line of an indented string must be empty.");
  }
  if (lastLine.trim() !== "") {
    throw new Error(
      "The last line of an indented string may only contain whitespace."
    );
  }

  const indent = lastLine.match(/^\s*/)?.[0] ?? "";

  return lines
    .slice(1, -1)
    .map((line) => line.replace(new RegExp(`^${indent}`), ""))
    .join("\n");
}
