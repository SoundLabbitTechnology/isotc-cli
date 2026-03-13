import { IAstParser } from "../../infrastructure/ports/iAstParser";
import { RuleValidator } from "../../domain/services/ruleValidator";
import { Constitution } from "../../domain/entities/constitution";

export class VerifyArchitectureUseCase {
  constructor(private astParser: IAstParser) {}
  public execute(projectPath: string, constitution: Constitution) {
    const dependencies = this.astParser.parseDirectory(projectPath);
    const validator = new RuleValidator(constitution, projectPath);
    return validator.checkViolations(dependencies);
  }
}
