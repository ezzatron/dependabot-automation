export function when([description]: TemplateStringsArray): (
  fn: () => void,
) => void {
  description = description.replaceAll(/\s+/g, " ").trim();

  return (fn) => {
    describe(`when ${description}`, fn);
  };
}
