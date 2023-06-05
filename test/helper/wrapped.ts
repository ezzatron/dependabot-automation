export function wrapped(strings: TemplateStringsArray, ...args: unknown[]) {
  const unwrapped = strings.map((s) => s.replaceAll(/\s+/g, " "));
  let result = "";

  for (let i = 0; i < unwrapped.length; i++) {
    result += unwrapped[i];
    result += args[i] ?? "";
  }

  return result.trim();
}
