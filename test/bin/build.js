#!/usr/bin/env node

import { build } from "esbuild";

const addRequire = `// add require()
const require = await (async () => {
	const { createRequire } = await import("node:module");

	return createRequire(import.meta.url);
})();`;

await build({
  entryPoints: ["src/parse-pull-request.ts"],
  bundle: true,
  sourcemap: true,
  platform: "node",
  target: "node16",
  format: "esm",
  outfile: "test/src/main.js",
  banner: {
    js: addRequire,
  },
});
