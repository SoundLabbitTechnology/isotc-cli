import * as path from "path";
import { DependencyNode } from "../entities/dependencyNode";
import { Constitution } from "../entities/constitution";
import { Counterexample } from "../entities/counterexample";

export class RuleValidator {
  constructor(private constitution: Constitution, private projectRoot: string) {}

  public checkViolations(dependencies: DependencyNode[]): Counterexample[] {
    // パスを解決し、レイヤーを特定して constitution.rules と突き合わせるロジック
    return []; 
  }
}
