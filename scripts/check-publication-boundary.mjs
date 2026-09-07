import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const forbidden = ["docs/adrs", "docs/updates"];
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0");
const found = forbidden.filter((directory) =>
  existsSync(directory) || tracked.some((file) => file === directory || file.startsWith(`${directory}/`)),
);
if (found.length) {
  console.error(`Internal engineering records cannot be stored or published here: ${found.join(", ")}`);
  process.exit(1);
}
console.log("Publication boundary verified: no ADR or update record directories.");
