export type CadEntityType = 'line' | 'polyline' | 'rectangle' | 'text';

export interface CadEntity {
  id: string;
  type: CadEntityType;
  layer: string;
  points: { x: number; y: number }[];
  text?: string;
  metadata: Record<string, any>;
}

export interface DetectedWarehouseElement {
  id: string;
  type: 'rack' | 'aisle' | 'wall' | 'zone' | 'dock';
  geometry: { x: number; y: number; width: number; height: number };
  layer: string;
  confidence: number;
  sourceEntities?: string[];
}
