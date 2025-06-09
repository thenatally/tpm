import inquirer from "inquirer";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { readPackage, writePackage, prompt as simplePrompt } from "../utils.js";

const frameworks = {
  frontend: [
    // { name: "Blank JS", value: "vanilla-js", deps: [], devDeps: [] },
    // { name: "Blank TS", value: "vanilla-ts", deps: [], devDeps: [] },
    { name: "React", value: "react", deps: [], devDeps: [] },
    { name: "Vue", value: "vue", deps: [], devDeps: [] },
    { name: "SvelteKit", value: "sveltekit", deps: [], devDeps: [] },
    { name: "Next.js", value: "nextjs", deps: [], devDeps: [] },
    { name: "Nuxt3", value: "nuxt3", deps: [], devDeps: [] },
    { name: "SolidJS", value: "solidjs", deps: [], devDeps: [] },
    { name: "Astro", value: "astro", deps: [], devDeps: [] },
    { name: "Remix", value: "remix", deps: [], devDeps: [] },
    { name: "Ember", value: "ember", deps: [], devDeps: [] },
  ],
  backend: [
    { name: "Blank JS", value: "vanilla-js", deps: [], devDeps: [] },
    { name: "Blank TS", value: "vanilla-ts", deps: [], devDeps: [] },
    {
      name: "Express",
      value: "express",
      deps: ["express"],
      devDeps: ["@types/express"],
    },
    { name: "Fastify", value: "fastify", deps: ["fastify"], devDeps: [] },
    { name: "Koa", value: "koa", deps: ["koa"], devDeps: ["@types/koa"] },
    { name: "Hapi", value: "hapi", deps: ["@hapi/hapi"], devDeps: [] },
    { name: "Node HTTP", value: "node-http", deps: [], devDeps: [] },
  ],
};

export async function initProject() {
  const handleSigint = () => {
    console.log("\nInitialization cancelled by user.");
    process.exit(0);
  };
  process.once("SIGINT", handleSigint);
  try {
    const { projectType } = await inquirer.prompt([
      {
        type: "list",
        name: "projectType",
        message: "What kind of project are you building?",
        choices: [
          { name: "Frontend", value: "frontend" },
          { name: "Backend / Library / CLI / Other", value: "backend" },
        ],
      },
    ]);

    let frameworkChoice;
    let extraPlugins = [];
    if (projectType === "frontend") {
      const { frontendFramework } = await inquirer.prompt([
        {
          type: "list",
          name: "frontendFramework",
          message: "Frontend framework:",
          choices: frameworks.frontend,
        },
      ]);
      frameworkChoice = frontendFramework;
      if (frontendFramework === "other") {
        const { customFramework } = await inquirer.prompt([
          {
            type: "input",
            name: "customFramework",
            message: "Enter framework name:",
          },
        ]);
        frameworkChoice = customFramework;
      }
    } else {
      const { backendFramework } = await inquirer.prompt([
        {
          type: "list",
          name: "backendFramework",
          message: "Backend / other / library / CLI / etc:",
          choices: frameworks.backend,
        },
      ]);
      frameworkChoice = backendFramework;
      if (backendFramework === "express") {
        const { expressPlugins } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "expressPlugins",
            message: "Select Express plugins/middleware to include:",
            choices: [
              { name: "cors", value: "cors" },
              { name: "body-parser", value: "body-parser" },
              { name: "morgan", value: "morgan" },
              { name: "helmet", value: "helmet" },
              { name: "cookie-parser", value: "cookie-parser" },
            ],
          },
        ]);
        extraPlugins = expressPlugins;
      } else if (backendFramework === "fastify") {
        const { fastifyPlugins } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "fastifyPlugins",
            message: "Select Fastify plugins to include:",
            choices: [
              { name: "@fastify/cors", value: "@fastify/cors" },
              { name: "@fastify/formbody", value: "@fastify/formbody" },
              { name: "@fastify/helmet", value: "@fastify/helmet" },
              { name: "@fastify/static", value: "@fastify/static" },
            ],
          },
        ]);
        extraPlugins = fastifyPlugins;
      } else if (backendFramework === "koa") {
        const { koaPlugins } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "koaPlugins",
            message: "Select Koa plugins/middleware to include:",
            choices: [
              { name: "koa-cors", value: "koa-cors" },
              { name: "koa-bodyparser", value: "koa-bodyparser" },
              { name: "koa-logger", value: "koa-logger" },
              { name: "koa-helmet", value: "koa-helmet" },
              { name: "koa-cookie", value: "koa-cookie" },
            ],
          },
        ]);
        extraPlugins = koaPlugins;
      } else if (backendFramework === "hapi") {
        const { hapiPlugins } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "hapiPlugins",
            message: "Select Hapi plugins to include:",
            choices: [
              { name: "@hapi/inert", value: "@hapi/inert" },
              { name: "@hapi/vision", value: "@hapi/vision" },
            ],
          },
        ]);
        extraPlugins = hapiPlugins;
      } else if (backendFramework === "node-http") {
        const { nodePlugins } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "nodePlugins",
            message: "Select Node HTTP plugins/helpers to include:",
            choices: [
              { name: "serve-static", value: "serve-static" },
              { name: "helmet", value: "helmet" },
              { name: "cookie", value: "cookie" },
            ],
          },
        ]);
        extraPlugins = nodePlugins;
      }
      if (backendFramework === "other") {
        const { customFramework } = await inquirer.prompt([
          {
            type: "input",
            name: "customFramework",
            message: "Enter framework name:",
          },
        ]);
        frameworkChoice = customFramework;
      }
    }

    let language = "js";
    let compileTS = false;
    let srcDir = ".";
    let outDir = "./dist";
    if (frameworkChoice === "vanilla-js") {
      language = "js";
    } else if (frameworkChoice === "vanilla-ts") {
      language = "ts";
      const { compile } = await inquirer.prompt([
        {
          type: "confirm",
          name: "compile",
          message: "Will you compile your TypeScript to JavaScript?",
          default: true,
        },
      ]);
      compileTS = compile;
      const { src } = await inquirer.prompt([
        {
          type: "list",
          name: "src",
          message: "What should be the root directory for your source files?",
          choices: [
            { name: "Current directory (.)", value: "." },
            { name: "./src", value: "./src" },
            { name: "Custom", value: "custom" },
          ],
        },
      ]);
      if (src === "custom") {
        const { customSrc } = await inquirer.prompt([
          {
            type: "input",
            name: "customSrc",
            message: "Enter custom source directory:",
          },
        ]);
        srcDir = customSrc;
      } else {
        srcDir = src;
      }
      if (compileTS) {
        const { out } = await inquirer.prompt([
          {
            type: "input",
            name: "out",
            message:
              "Where should the compiled output (dist) directory be located?",
            default: "./dist",
          },
        ]);
        outDir = out;
      }
    } else if (frameworkChoice === "solidjs") {
      const { solidTemplate } = await inquirer.prompt([
        {
          type: "list",
          name: "solidTemplate",
          message: "SolidJS template:",
          choices: [
            { name: "TypeScript", value: "ts" },
            { name: "JavaScript", value: "js" },
          ],
          default: "ts",
        },
      ]);
      language = solidTemplate === "ts" ? "ts" : "js";
      compileTS = solidTemplate === "ts";
      srcDir = "./src";
      outDir = "./dist";
    } else if (
      projectType === "frontend" &&
      [
        "react",
        "vue",
        "sveltekit",
        "nextjs",
        "nuxt3",
        "astro",
        "remix",
        "ember",
      ].includes(frameworkChoice)
    ) {
    } else if (projectType === "backend") {
      const { lang } = await inquirer.prompt([
        {
          type: "list",
          name: "lang",
          message: "Do you want to use JavaScript or TypeScript?",
          choices: [
            { name: "JavaScript", value: "js" },
            { name: "TypeScript", value: "ts" },
          ],
        },
      ]);
      language = lang;
      if (lang === "ts") {
        const { compile } = await inquirer.prompt([
          {
            type: "confirm",
            name: "compile",
            message: "Will you compile your TypeScript to JavaScript?",
            default: true,
          },
        ]);
        compileTS = compile;
        const { src } = await inquirer.prompt([
          {
            type: "list",
            name: "src",
            message: "What should be the root directory for your source files?",
            choices: [
              { name: "Current directory (.)", value: "." },
              { name: "./src", value: "./src" },
              { name: "Custom", value: "custom" },
            ],
          },
        ]);
        if (src === "custom") {
          const { customSrc } = await inquirer.prompt([
            {
              type: "input",
              name: "customSrc",
              message: "Enter custom source directory:",
            },
          ]);
          srcDir = customSrc;
        } else {
          srcDir = src;
        }
        if (compileTS) {
          const { out } = await inquirer.prompt([
            {
              type: "input",
              name: "out",
              message:
                "Where should the compiled output (dist) directory be located?",
              default: "./dist",
            },
          ]);
          outDir = out;
        }
      }
    }

    const defaultName = path.basename(process.cwd());
    const npmInitAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Project name:",
        default: defaultName,
        validate: (x) =>
          (x && /^[a-zA-Z0-9-_]+$/.test(x)) ||
          "Name must be non-empty and URL-safe",
      },
      {
        type: "input",
        name: "version",
        message: "Version:",
        default: "1.0.0",
        validate: (x) =>
          /^\d+\.\d+\.\d+$/.test(x) || "Version must be in x.y.z format",
      },
      {
        type: "input",
        name: "author",
        message: "Author:",
      },
      {
        type: "input",
        name: "license",
        message: "License:",
        default: "ISC",
      },
      {
        type: "input",
        name: "description",
        message: "Description:",
      },
    ]);

    const pkg = {
      name: npmInitAnswers.name,
      version: npmInitAnswers.version,
      author: npmInitAnswers.author,
      license: npmInitAnswers.license,
      description: npmInitAnswers.description,
      scripts: {},
      dependencies: {},
      devDependencies: {},
    };

    if (language === "ts") {
      if (projectType === "backend") {
        pkg.type = "module";
      }
      if (compileTS) {
        pkg.scripts.build = `tsc${
          srcDir !== "." ? ` --project tsconfig.json` : ""
        }`;
        pkg.scripts.start = `node ${outDir}/index.js`;
        pkg.devDependencies.typescript = "^5.0.0";
        // Add watch/serve for backend TypeScript projects
        if (projectType === "backend") {
          const { enableWatch } = await inquirer.prompt([
            {
              type: "confirm",
              name: "enableWatch",
              message:
                "Add watch and serve scripts with tsc --watch and nodemon?",
              default: true,
            },
          ]);
          if (enableWatch) {
            pkg.scripts.watch = `tsc --watch${
              srcDir !== "." ? ` --project tsconfig.json` : ""
            }`;
            pkg.scripts.serve = `nodemon ${outDir}/index.js`;
            pkg.devDependencies.nodemon = "^3.0.0";
          }
        }
      } else {
        pkg.scripts.start = `tsx ${srcDir}/index.ts`;
        pkg.devDependencies["tsx"] = "^4.0.0";
        pkg.devDependencies.typescript = "^5.0.0";
      }
    } else {
      pkg.scripts.start = "node index.js";
    }

    let fw = frameworks[projectType].find((f) => f.value === frameworkChoice);
    if (fw) {
      (fw.deps || []).forEach((dep) => (pkg.dependencies[dep] = "latest"));
      (fw.devDeps || []).forEach(
        (dep) => (pkg.devDependencies[dep] = "latest")
      );
    } else if (frameworkChoice && frameworkChoice !== "other") {
      pkg.dependencies[frameworkChoice] = "latest";
    }
    if (extraPlugins && extraPlugins.length) {
      extraPlugins.forEach((dep) => {
        pkg.dependencies[dep] = "latest";
        if (language === "ts") {
          if (frameworkChoice === "express") {
            if (dep === "cors" || dep === "morgan" || dep === "cookie-parser") {
              pkg.devDependencies[`@types/${dep}`] = "latest";
            }
            if (dep === "body-parser") {
              pkg.devDependencies["@types/body-parser"] = "latest";
            }
            if (dep === "helmet") {
              pkg.devDependencies["@types/helmet"] = "latest";
            }
          }
          if (frameworkChoice === "koa") {
            if (dep === "koa-cors") {
              pkg.devDependencies["@types/koa-cors"] = "latest";
            }
            if (dep === "koa-bodyparser") {
              pkg.devDependencies["@types/koa-bodyparser"] = "latest";
            }
            if (dep === "koa-logger") {
              pkg.devDependencies["@types/koa-logger"] = "latest";
            }
            if (dep === "koa-helmet") {
              pkg.devDependencies["@types/koa-helmet"] = "latest";
            }
            if (dep === "koa-cookie") {
              pkg.devDependencies["@types/koa-cookie"] = "latest";
            }
          }
          if (frameworkChoice === "node-http") {
            if (dep === "serve-static") {
              pkg.devDependencies["@types/serve-static"] = "latest";
            }
          }
        }
      });
    }

    const isFrontendScaffold =
      projectType === "frontend" &&
      [
        "react",
        "vue",
        "angular",
        "svelte",
        "sveltekit",
        "nextjs",
        "nuxt3",
        "solidjs",
        "lit",
        "astro",
        "remix",
        "ember",
        "backbone",
      ].includes(frameworkChoice);
    if (!isFrontendScaffold) {
      await writePackage(pkg);
      if (language === "ts") {
        const tsconfig = {
          compilerOptions: {
            target: "esnext",
            module: "esnext",
            moduleResolution: "node",
            outDir: compileTS ? outDir : undefined,
            rootDir: srcDir,
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
          },
          include: [srcDir + "/**/*"],
        };
        await writeFile("tsconfig.json", JSON.stringify(tsconfig, null, 2));
      }
      if (language === "ts" && srcDir !== ".") {
        await mkdir(srcDir, { recursive: true });
      }
      let starter = "";
      if (projectType === "backend") {
        if (frameworkChoice === "express") {
          let imports =
            language === "ts"
              ? `import express from 'express';\n`
              : `const express = require('express');\n`;
          let uses = "";
          if (extraPlugins.includes("cors")) {
            imports +=
              language === "ts"
                ? `import cors from 'cors';\n`
                : `const cors = require('cors');\n`;
            uses += "app.use(cors());\n";
          }
          if (extraPlugins.includes("body-parser")) {
            imports +=
              language === "ts"
                ? `import bodyParser from 'body-parser';\n`
                : `const bodyParser = require('body-parser');\n`;
            uses +=
              "app.use(bodyParser.json());\napp.use(bodyParser.urlencoded({ extended: true }));\n";
          }
          if (extraPlugins.includes("morgan")) {
            imports +=
              language === "ts"
                ? `import morgan from 'morgan';\n`
                : `const morgan = require('morgan');\n`;
            uses += `app.use(morgan('dev'));\n`;
          }
          if (extraPlugins.includes("helmet")) {
            imports +=
              language === "ts"
                ? `import helmet from 'helmet';\n`
                : `const helmet = require('helmet');\n`;
            uses += "app.use(helmet());\n";
          }
          if (extraPlugins.includes("cookie-parser")) {
            imports +=
              language === "ts"
                ? `import cookieParser from 'cookie-parser';\n`
                : `const cookieParser = require('cookie-parser');\n`;
            uses += "app.use(cookieParser());\n";
          }
          starter = `${imports}const app = express();\n${uses}const port = 3000;\napp.get('/', (req, res) => {res.send('Hello from Express!')});\napp.listen(port, () => console.log('Express server running on port', port));\n`;
        } else if (frameworkChoice === "fastify") {
          let imports =
            language === "ts"
              ? `import Fastify from 'fastify';\n`
              : `const Fastify = require('fastify');\n`;
          let uses = "";
          if (extraPlugins.includes("@fastify/cors")) {
            imports +=
              language === "ts"
                ? `import fastifyCors from '@fastify/cors';\n`
                : `const fastifyCors = require('@fastify/cors');\n`;
            uses += "fastify.register(fastifyCors);\n";
          }
          if (extraPlugins.includes("@fastify/formbody")) {
            imports +=
              language === "ts"
                ? `import fastifyFormbody from '@fastify/formbody';\n`
                : `const fastifyFormbody = require('@fastify/formbody');\n`;
            uses += "fastify.register(fastifyFormbody);\n";
          }
          if (extraPlugins.includes("@fastify/helmet")) {
            imports +=
              language === "ts"
                ? `import fastifyHelmet from '@fastify/helmet';\n`
                : `const fastifyHelmet = require('@fastify/helmet');\n`;
            uses += "fastify.register(fastifyHelmet);\n";
          }
          if (extraPlugins.includes("@fastify/static")) {
            imports +=
              language === "ts"
                ? `import fastifyStatic from '@fastify/static';\n`
                : `const fastifyStatic = require('@fastify/static');\n`;
            uses +=
              "// fastify.register(fastifyStatic, { root: path.join(__dirname, 'public') });\n";
          }
          starter = `${imports}const fastify = Fastify();\n${uses}fastify.get('/', async (request, reply) => 'Hello from Fastify!');\nfastify.listen({ port: 3000 }, err => {\n  if (err) throw err;\n  console.log('Fastify server running on port 3000');\n});\n`;
        } else if (frameworkChoice === "koa") {
          let imports =
            language === "ts"
              ? `import Koa from 'koa';\n`
              : `const Koa = require('koa');\n`;
          let uses = "";
          if (extraPlugins.includes("koa-cors")) {
            imports +=
              language === "ts"
                ? `import koaCors from 'koa-cors';\n`
                : `const koaCors = require('koa-cors');\n`;
            uses += "app.use(koaCors());\n";
          }
          if (extraPlugins.includes("koa-bodyparser")) {
            imports +=
              language === "ts"
                ? `import koaBodyparser from 'koa-bodyparser';\n`
                : `const koaBodyparser = require('koa-bodyparser');\n`;
            uses += "app.use(koaBodyparser());\n";
          }
          if (extraPlugins.includes("koa-logger")) {
            imports +=
              language === "ts"
                ? `import koaLogger from 'koa-logger';\n`
                : `const koaLogger = require('koa-logger');\n`;
            uses += `app.use(koaLogger())\n`;
          }
          if (extraPlugins.includes("koa-helmet")) {
            imports +=
              language === "ts"
                ? `import koaHelmet from 'koa-helmet';\n`
                : `const koaHelmet = require('koa-helmet');\n`;
            uses += "app.use(koaHelmet());\n";
          }
          if (extraPlugins.includes("koa-cookie")) {
            imports +=
              language === "ts"
                ? `import koaCookie from 'koa-cookie';\n`
                : `const koaCookie = require('koa-cookie');\n`;
            uses += "app.use(koaCookie());\n";
          }
          starter = `${imports}const app = new Koa();\n${uses}const port = 3000;\napp.use(async ctx => {ctx.body = 'Hello from Koa!';});\napp.listen(port, () => console.log('Koa server running on port', port));\n`;
        } else if (frameworkChoice === "hapi") {
          let imports =
            language === "ts"
              ? `import Hapi from '@hapi/hapi';\n`
              : `const Hapi = require('@hapi/hapi');\n`;
          let uses = "";
          if (extraPlugins.includes("@hapi/cors")) {
            imports +=
              language === "ts"
                ? `import hapiCors from '@hapi/cors';\n`
                : `const hapiCors = require('@hapi/cors');\n`;
            uses += "server.register(hapiCors);\n";
          }
          if (extraPlugins.includes("@hapi/inert")) {
            imports +=
              language === "ts"
                ? `import Inert from '@hapi/inert';\n`
                : `const Inert = require('@hapi/inert');\n`;
            uses += "server.register(Inert);\n";
          }
          if (extraPlugins.includes("@hapi/vision")) {
            imports +=
              language === "ts"
                ? `import Vision from '@hapi/vision';\n`
                : `const Vision = require('@hapi/vision');\n`;
            uses += "server.register(Vision);\n";
          }
          starter = `${imports}const server = Hapi.server({ port: 3000 });\n${uses}server.route({method: 'GET', path: '/', handler: (request, h) => 'Hello from Hapi!'});\nserver.start();\nconsole.log('Hapi server running on %s', server.info.uri);\n`;
        } else if (frameworkChoice === "node-http") {
          let imports =
            language === "ts"
              ? `import http from 'node:http';\n`
              : `const http = require('node:http');\n`;
          let uses = "";
          if (extraPlugins.includes("serve-static")) {
            imports +=
              language === "ts"
                ? `import serveStatic from 'serve-static';\n`
                : `const serveStatic = require('serve-static');\n`;
            uses +=
              "// You can use serve-static with finalhandler for static files\n";
          }
          if (extraPlugins.includes("helmet")) {
            imports +=
              language === "ts"
                ? `import helmet from 'helmet';\n`
                : `const helmet = require('helmet');\n`;
            uses +=
              "// You can use helmet with http server using helmet.contentSecurityPolicy() etc.\n";
          }
          if (extraPlugins.includes("cookie")) {
            imports +=
              language === "ts"
                ? `import cookie from 'cookie';\n`
                : `const cookie = require('cookie');\n`;
            uses +=
              "// You can use cookie to parse cookies from req.headers.cookie\n";
          }
          starter = `${imports}const server = http.createServer((req, res) => {\n  ${uses}res.writeHead(200, { 'Content-Type': 'text/plain' });\n  res.end('Hello from Node HTTP!');\n});\nserver.listen(3000, () => {\n  console.log('Node HTTP server running on port 3000');\n});\n`;
        } else if (frameworkChoice === "vanilla-ts") {
          starter = `console.log('Hello from TypeScript!');\n`;
        } else if (frameworkChoice === "vanilla-js") {
          starter = `console.log('Hello from JavaScript!');\n`;
        } else {
          starter =
            language === "ts"
              ? `console.log('Hello from TypeScript!');\n`
              : `console.log('Hello from JavaScript!');\n`;
        }
        if (language === "ts") {
          await writeFile(`${srcDir}/index.ts`, starter);
        } else {
          await writeFile("index.js", starter);
        }
      } else {
        if (language === "ts") {
          await writeFile(
            `${srcDir}/index.ts`,
            `console.log('Hello from TypeScript!');\n`
          );
        } else {
          await writeFile(
            "index.js",
            `console.log('Hello from JavaScript!');\n`
          );
        }
      }
    }

    let depList = [];
    if (fw && fw.deps && fw.deps.length)
      depList.push(
        ...fw.deps.map((dep) => ({ name: dep, value: dep, checked: true }))
      );
    if (fw && fw.devDeps && fw.devDeps.length)
      depList.push(
        ...fw.devDeps.map((dep) => ({
          name: dep + " (dev)",
          value: dep,
          checked: true,
        }))
      );
    if (language === "ts")
      depList.push({
        name: "typescript (dev)",
        value: "typescript",
        checked: true,
      });
    if (language === "ts" && !compileTS)
      depList.push({ name: "tsx (dev)", value: "tsx", checked: true });
    if (language === "ts")
      depList.push({
        name: "@types/node (dev)",
        value: "@types/node",
        checked: false,
      });
    if (
      language === "ts" &&
      (projectType === "frontend" ||
        ["react", "vue", "svelte"].includes(frameworkChoice))
    ) {
      depList.push({
        name: "@types/web (dev)",
        value: "@types/web",
        checked: false,
      });
    }

    if (depList.length) {
      const { depsToInstall } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "depsToInstall",
          message: "Select dependencies to install now:",
          choices: depList,
        },
      ]);
      if (depsToInstall.length) {
        const devDeps = depList
          .filter(
            (d) => d.name.includes("(dev)") && depsToInstall.includes(d.value)
          )
          .map((d) => d.value);
        const prodDeps = depList
          .filter(
            (d) => !d.name.includes("(dev)") && depsToInstall.includes(d.value)
          )
          .map((d) => d.value);
        if (prodDeps.length) {
          const { spawnSync } = await import("child_process");
          const res = spawnSync("npm", ["install", ...prodDeps], {
            stdio: "inherit",
          });
          if (res.error)
            console.error("Failed to install dependencies:", res.error);
        }
        if (devDeps.length) {
          const { spawnSync } = await import("child_process");
          const res = spawnSync("npm", ["install", "-D", ...devDeps], {
            stdio: "inherit",
          });
          if (res.error)
            console.error("Failed to install devDependencies:", res.error);
        }
      }
    }
    const { existsSync, appendFileSync, readFileSync } = await import("fs");
    let inGit = existsSync(".git");
    if (!inGit) {
      const { initGit } = await inquirer.prompt([
        {
          type: "confirm",
          name: "initGit",
          message: "No git repository found. Initialize a new git repo?",
          default: true,
        },
      ]);
      if (initGit) {
        const { spawnSync } = await import("child_process");
        const res = spawnSync("git", ["init"], { stdio: "inherit" });
        if (!res.error) {
          inGit = true;
          await writeFile(
            "README.md",
            `# ${npmInitAnswers.name}\n\n${npmInitAnswers.description || ""}\n`
          );
          spawnSync("git", ["add", "."], { stdio: "inherit" });
          spawnSync("git", ["commit", "-m", "Initial commit"], {
            stdio: "inherit",
          });
          console.log("Initialized git repository and made initial commit.");
        } else {
          console.error("Failed to initialize git:", res.error);
        }
      }
    }
    if (inGit) {
      let gitignoreContent = "";
      if (existsSync(".gitignore")) {
        gitignoreContent = readFileSync(".gitignore", "utf8");
      }
      if (!gitignoreContent.includes("node_modules")) {
        const { addNodeModules } = await inquirer.prompt([
          {
            type: "confirm",
            name: "addNodeModules",
            message: "Add node_modules/ to .gitignore?",
            default: true,
          },
        ]);
        if (addNodeModules) {
          appendFileSync(
            ".gitignore",
            (gitignoreContent.endsWith("\n") ? "" : "\n") + "node_modules\n"
          );
          console.log("Added node_modules to .gitignore");
        }
      }
      // Ask for dist
      if (!gitignoreContent.includes("dist")) {
        const { addDist } = await inquirer.prompt([
          {
            type: "confirm",
            name: "addDist",
            message: "Add dist/ to .gitignore?",
            default: true,
          },
        ]);
        if (addDist) {
          appendFileSync(
            ".gitignore",
            (gitignoreContent.endsWith("\n") ? "" : "\n") + "dist\n"
          );
          console.log("Added dist to .gitignore");
        }
      }
    }
    if (projectType === "frontend") {
      const { name } = npmInitAnswers;
      const lowerName = name.replace(/[^a-zA-Z0-9-_]/g, "-");
      const { scaffoldDir } = await inquirer.prompt([
        {
          type: "list",
          name: "scaffoldDir",
          message: "Where should the project be created?",
          choices: [
            { name: "Current directory", value: "." },
            { name: `New subdirectory ./${lowerName}`, value: lowerName },
          ],
          default: ".",
        },
      ]);
      let scaffoldCmd,
        scaffoldArgs,
        prettyName,
        needsMove = false,
        tempDir = lowerName;
      switch (frameworkChoice) {
        case "react":
          scaffoldCmd = "npx";
          scaffoldArgs = [
            "create-react-app",
            scaffoldDir === "." ? "." : lowerName,
          ];
          prettyName = "React";
          break;
        case "vue":
          scaffoldCmd = "npm";
          scaffoldArgs = [
            "create",
            "vue@latest",
            scaffoldDir === "." ? "." : lowerName,
          ];
          prettyName = "Vue";
          break;
        case "sveltekit":
          scaffoldCmd = "npx";
          if (scaffoldDir === ".") {
            scaffoldArgs = ["sv", "create", tempDir];
            needsMove = true;
          } else {
            scaffoldArgs = ["sv", "create", lowerName];
          }
          prettyName = "SvelteKit";
          break;
        case "nextjs":
          scaffoldCmd = "npx";
          scaffoldArgs = [
            "create-next-app@latest",
            scaffoldDir === "." ? "." : lowerName,
          ];
          prettyName = "Next.js";
          break;
        case "nuxt3":
          scaffoldCmd = "npx";
          if (scaffoldDir === ".") {
            scaffoldArgs = ["nuxi", "init", tempDir];
            needsMove = true;
          } else {
            scaffoldArgs = ["nuxi", "init", lowerName];
          }
          prettyName = "Nuxt3";
          break;
        case "solidjs": {
          const solidTemplateDir =
            language === "ts" ? "solidjs/templates/ts" : "solidjs/templates/js";
          scaffoldCmd = "npx";
          if (scaffoldDir === ".") {
            scaffoldArgs = ["degit", solidTemplateDir, tempDir];
            needsMove = true;
          } else {
            scaffoldArgs = ["degit", solidTemplateDir, lowerName];
          }
          prettyName = "SolidJS";
          break;
        }
        case "astro":
          scaffoldCmd = "npm";
          scaffoldArgs = [
            "create",
            "astro@latest",
            scaffoldDir === "." ? "." : lowerName,
          ];
          prettyName = "Astro";
          break;
        case "remix":
          scaffoldCmd = "npx";
          scaffoldArgs = [
            "create-remix@latest",
            scaffoldDir === "." ? "." : lowerName,
          ];
          prettyName = "Remix";
          break;
        case "ember":
          scaffoldCmd = "npx";
          scaffoldArgs = ["ember-cli", "init"];
          prettyName = "Ember";
          break;
        default:
          break;
      }
      if (scaffoldCmd && scaffoldArgs) {
        const { spawnSync } = await import("child_process");
        console.log(
          `Scaffolding ${prettyName} project with: ${scaffoldCmd} ${scaffoldArgs.join(
            " "
          )}`
        );
        const res = spawnSync(scaffoldCmd, scaffoldArgs, { stdio: "inherit" });
        if (res.error) {
          console.error(`Failed to scaffold ${prettyName} project:`, res.error);
          return;
        }
        if (needsMove) {
          const { readdirSync, renameSync, existsSync, rmSync } = await import(
            "fs"
          );
          const files = readdirSync(tempDir);
          for (const file of files) {
            if (existsSync(file)) {
              rmSync(file, { recursive: true, force: true });
            }
            renameSync(`${tempDir}/${file}`, file);
          }
          rmSync(tempDir, { recursive: true, force: true });
        }
        if (frameworkChoice === "vue" || frameworkChoice === "solidjs") {
          console.log("Running npm install...");
          const installRes = spawnSync("npm", ["install"], {
            stdio: "inherit",
          });
          if (installRes.error) {
            console.error("npm install failed:", installRes.error);
          }
        }
        if (frameworkChoice !== "vue") {
          const pkgPath =
            scaffoldDir === "." || needsMove
              ? "package.json"
              : `${lowerName}/package.json`;
          try {
            let pkgData;
            if (pkgPath === "package.json") {
              pkgData = await readPackage();
            } else {
              const { readFileSync, writeFileSync } = await import("fs");
              pkgData = JSON.parse(readFileSync(pkgPath, "utf8"));
              pkgData.name = name;
              pkgData.author = npmInitAnswers.author;
              pkgData.license = npmInitAnswers.license;
              if (npmInitAnswers.description)
                pkgData.description = npmInitAnswers.description;
              writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2));
              return;
            }
            pkgData.name = name;
            pkgData.author = npmInitAnswers.author;
            pkgData.license = npmInitAnswers.license;
            if (npmInitAnswers.description)
              pkgData.description = npmInitAnswers.description;
            await writePackage(pkgData);
          } catch (e) {
            console.warn("Could not patch package.json:", e.message);
          }
        }
        console.log(`${prettyName} project created!`);
        return;
      }
    }

    console.log("\nProject initialized!");
  } catch (err) {
    if (err instanceof Error && err.message === "SIGINT") {
      console.log("\nInitialization cancelled by user.");
      process.exit(0);
    } else {
      throw err;
    }
  } finally {
    process.removeListener("SIGINT", handleSigint);
  }
}
