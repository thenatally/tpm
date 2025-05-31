import depcheck from "depcheck";
import { execSync } from "child_process";
import PromptSync from "prompt-sync";
import { readFileSync, existsSync } from "fs";

const prompt = PromptSync({ sigint: true });
export async function checkDeps() {
  let tsconfigAliases = [];
  let tsconfigPaths = {};
  const tsconfigPath = process.cwd() + "/tsconfig.json";
  if (existsSync(tsconfigPath)) {
    // try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    tsconfigPaths =
      (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};
    // console.log(Object.keys(tsconfigPaths).length, tsconfigPaths);
    Object.keys(tsconfigPaths).forEach((alias) => {
    //   console.log(alias, tsconfigPaths[alias]);
      try {
        tsconfigAliases.push({
          pattern: new RegExp("^" + alias.replace("/*", "/.+")),
          alias,
        });
      } catch (e) {}
    });
    // } catch (e) {

    // }
  }
  //   console.log(tsconfigAliases.length, tsconfigPaths, tsconfigAliases)
  depcheck(process.cwd(), {}, async (unused) => {
    const { dependencies, missing } = unused;
    // if (dependencies.length) console.log("Unused deps:", dependencies);
    if (Object.keys(missing).length) {
      console.log("Missing deps:");
      for (const dep in missing) {
        const isAlias = tsconfigAliases.some((a) => a.pattern.test(dep));
        if (!isAlias) {
          console.log(`- ${dep} (used in ${missing[dep]})`);
        }
      }
      const realMissing = Object.keys(missing).filter(
        (dep) => !tsconfigAliases.some((a) => a.pattern.test(dep))
      );
      if (realMissing.length) {
        const toInstall = realMissing.join(" ");
        const confirm = prompt(`Install missing deps? (${toInstall}) [y/N] `);
        if (confirm.toLowerCase().startsWith("y")) {
          execSync(`npm install ${toInstall}`, { stdio: "inherit" });
        }
      }
    }
    console.log("\n")
    if (dependencies.length) {
        console.log("Unused deps:\n" + dependencies.map(dep => `- ${dep}`).join("\n"));
      const confirmRemove = prompt(
        `Remove unused deps? [y/N] `
      );
      if (confirmRemove.toLowerCase().startsWith("y")) {
        execSync(`npm uninstall ${dependencies.join(" ")}`, {
          stdio: "inherit",
        });
      }
    }
  });
}
