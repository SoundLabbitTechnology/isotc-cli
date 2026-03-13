export interface LayerConfig { name: string; basePath: string; }
export interface Constitution {
  layers: LayerConfig[];
  rules: { [layerName: string]: string[] };
}
