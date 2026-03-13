export interface LayerConfig {
  name: string;
  basePath: string;
}

export interface SteeringConfig {
  codingStandards?: string;
  technologyStack?: string;
  designPrinciples?: string;
  [key: string]: string | undefined;
}

export interface PackageRules {
  allow?: string[];
  deny?: string[];
}

export interface ChecksConfig {
  disallowNewConcreteIn?: string[];
}

export interface Constitution {
  layers: LayerConfig[];
  rules: { [layerName: string]: string[] };
  steering?: SteeringConfig;
  /** レイヤーごとのパッケージ import ルール（オプション） */
  packageRules?: { [layerName: string]: PackageRules };
  /** 追加検査設定（オプション） */
  checks?: ChecksConfig;
}
