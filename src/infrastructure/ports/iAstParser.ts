import { DependencyNode } from "../../domain/entities/dependencyNode";
export interface IAstParser {
  parseDirectory(directoryPath: string): DependencyNode[];
}
