#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./presentation/commands/initCommand";
import { intentCommand } from "./presentation/commands/intentCommand";
import { planCommand } from "./presentation/commands/planCommand";
import { implCommand } from "./presentation/commands/implCommand";
import { verifyCommand } from "./presentation/commands/verifyCommand";
import { traceCommand } from "./presentation/commands/traceCommand";

const program = new Command();

program
  .name("isotc")
  .description("Intent-to-Spec Optimal Transport Compiler - 仕様・アーキテクチャ境界の検証とトレーサビリティ支援CLI")
  .version("0.1.0");

program.addCommand(initCommand());
program.addCommand(intentCommand());
program.addCommand(planCommand());
program.addCommand(implCommand());
program.addCommand(verifyCommand());
program.addCommand(traceCommand());

program.parse();
