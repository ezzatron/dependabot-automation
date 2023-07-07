/**
 * An imitation of Swift's multiline string literals.
 *
 * The tagged template literal can be indented to match the surrounding code.
 * The whitespace before the closing backtick (`) determines what whitespace to
 * ignore before all of the other lines. However, if you write whitespace at the
 * beginning of a line in addition to what’s before the closing backtick, that
 * whitespace is included.
 */
export function indented(
  strings: TemplateStringsArray,
  ...args: unknown[]
): string {
  const allStrings = strings.join("");
  const stringsLines = allStrings.split("\n");
  const firstLine = stringsLines[0];
  const lastLine = stringsLines[stringsLines.length - 1];

  if (firstLine !== "") {
    throw new Error("The first line of an indented string must be empty.");
  }

  if (lastLine.trim() !== "") {
    throw new Error(
      "The last line of an indented string may only contain whitespace.",
    );
  }

  const indent = lastLine.match(/^\s*/)?.[0] ?? "";
  const indentPattern = new RegExp(`^${indent}`);
  const allIndentPattern = new RegExp(`^${indent}`, "gm");
  const contentLines = stringsLines.slice(1, -1);

  for (let i = 0; i < contentLines.length; ++i) {
    const line = contentLines[i];

    if (line === "") continue;

    if (!indentPattern.test(line)) {
      throw new Error(
        `Line ${i + 1} of indented string has incorrect indentation. ` +
          `Line content: ${JSON.stringify(line)}}`,
      );
    }
  }

  let composed = "";

  for (let i = 0; i < strings.length; ++i) {
    composed += strings[i].replaceAll(allIndentPattern, "");
    if (i < args.length) composed += args[i];
  }

  const composedLines = composed.split("\n");

  return composedLines.slice(1, -1).join("\n");
}
