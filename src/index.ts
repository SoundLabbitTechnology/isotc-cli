#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./presentation/commands/initCommand";
import { intentCommand } from "./presentation/commands/intentCommand";
import { planCommand } from "./presentation/commands/planCommand";
import { implCommand } from "./presentation/commands/implCommand";
import { handoffCommand } from "./presentation/commands/handoffCommand";
import { verifyCommand } from "./presentation/commands/verifyCommand";
import { traceCommand } from "./presentation/commands/traceCommand";
import { doctorCommand } from "./presentation/commands/doctorCommand";
import { emitCommand } from "./presentation/commands/emitCommand";

// バージョンは package.json から一元管理（dist/index.js から見て ../package.json）
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
  .name("isotc")
  .description("Intent-to-Spec Optimal Transport Compiler - 仕様・アーキテクチャ境界の検証とトレーサビリティ支援CLI")
  .version(version);

program.addCommand(initCommand());
program.addCommand(intentCommand());
program.addCommand(planCommand());
program.addCommand(implCommand());
program.addCommand(handoffCommand());
program.addCommand(verifyCommand());
program.addCommand(traceCommand());
program.addCommand(doctorCommand());
program.addCommand(emitCommand());

program.parse();
