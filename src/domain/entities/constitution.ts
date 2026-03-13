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

export interface Constitution {
  layers: LayerConfig[];
  rules: { [layerName: string]: string[] };
  steering?: SteeringConfig;
}
