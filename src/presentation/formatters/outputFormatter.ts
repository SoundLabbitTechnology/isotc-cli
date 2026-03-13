import { Counterexample } from "../../domain/entities/counterexample";
import { Constitution } from "../../domain/entities/constitution";

/**
 * 検証結果の出力フォーマッターのインターフェース
 * JSON/Text の出し分けを抽象化
 */
export interface IOutputFormatter {
  format(violations: Counterexample[], constitution: Constitution, durationMs?: number): string;
}
