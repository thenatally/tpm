#!/usr/bin/env node

import { Command } from "commander";
import { runScript } from "../lib/commands/run.js";
import { addScript } from "../lib/commands/add.js";
import { setField } from "../lib/commands/set.js";
import { checkDeps } from "../lib/commands/cd.js";
import { spawn } from "child_process";
import { addAlias, removeAlias } from "../lib/commands/alias.js";

const program = new Command();

program
  .command("run")
  .alias("r")
  .argument("[scripts...]", "One or more scripts to run from package.json")
  .description("Run one or multiple scripts from package.json")
  .action(runScript);

program
  .command("add")
  .argument("<scriptName>", "Name of the script to add")
  .description("Add a new npm script to package.json")
  .action(addScript);

program
  .command("set")
  .description("Set a field in package.json")
  .argument("<key>", "Field to set in package.json")
  .argument("<value>", "Value to set for the field")
  .action(setField);

program
  .command("checkdeps")
  .alias("cd")
  .alias("checkdependencies")
  .description("Check for unused or missing deps")
  .action(checkDeps);

program
  .command("ln")
  .alias("link")
  .alias("alias")
  .argument("<scriptName>", "Script name to alias (source)")
  .argument("<alias>", "Alias name to create (target)")
  .description("Create an alias for a script in .tpm.aliases in package.json (like 'ln <source> <target>')")
  .action((scriptName, alias) => addAlias(alias, scriptName));

program
  .command("unlink")
  .alias("uln")
  .alias("dealias")
  .alias("unalias")
  .argument("<alias>", "Alias name to remove")
  .description("Remove an alias from .tpm.aliases in package.json")
  .action(removeAlias);

program
  .command("init")
  .description("Bootstrap a new project")
  .action(async () => {
    const { initProject } = await import("../lib/commands/init.js");
    try {
      await initProject();
    } catch (err) {
      if (err && err.name !== 'ExitPromptError') {
        console.error("Error during project initialization:", err);
      }
      process.exit(1);
    }
  });

const npmCommands = [
  "install",
  "i",
  "uninstall",
  "remove",
  "rm",
  "update",
  "run",
  // "init",
  "publish",
  "unpublish",
  "link",
  "unlink",
  "outdated",
  "audit",
  "audit fix",
  "restart",
  "login",
  "logout",
  "whoami",
  "cache",
  "config",
  "rebuild",
  "reinstall",
  "version",
  //   'help',
  "search",
  "set-script",
  "exec",
  "pkg",
  "root",
  "view",
  "ls",
  "docs",
  "dedupe",
  "prune",
  "ci",
  "doctor",
  "fund",
  "prefix",
  "team",
  "org",
  "access",
  "profile",
  "token",
];

if (npmCommands.includes(process.argv[2])) {
  (async () => {
    if (process.argv[2] === "publish") {
      if (!process.argv.some(arg => arg.startsWith("--access"))) {
        const PromptSync = await import('prompt-sync');
        const prompt = PromptSync.default({ sigint: true });
        const answer = prompt("Add --access=public to publish? [Y/n] ");
        if (!answer || answer.toLowerCase().startsWith("y")) {
          process.argv.splice(3, 0, "--access=public");
        }
      }
      const npmArgs = process.argv.slice(2);
      const child = spawn("npm", npmArgs, { stdio: "inherit" });
      child.on("exit", process.exit);
    } else {
      const npmArgs = process.argv.slice(2);
      const child = spawn("npm", npmArgs, { stdio: "inherit" });
      child.on("exit", process.exit);
    }
  })();
} else {
  program
    .command("*")
    .argument("<script>")
    .argument("[args...]")
    .description(
      "Run a script from package.json (shortcut for 'tpm run <script>')"
    )
    .action((script, args) => {
      if (
        npmCommands.includes(script) ||
        ["run", "add", "set", "checkdeps", "cd", "checkdependencies"].includes(
          script
        )
      ) {
        program.help();
      } else {
        runScript([script, ...args]);
      }
    });

  program.parse(process.argv);
}
