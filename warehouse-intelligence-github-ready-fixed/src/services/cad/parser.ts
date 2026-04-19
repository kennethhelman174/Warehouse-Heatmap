import DxfParser from 'dxf-parser';
import { CadEntity, DetectedWarehouseElement } from './types';

export class CadParserService {
  parseFile(userId: string, filename: string, buf: Buffer): { rawEntities: CadEntity[], detectedElements: DetectedWarehouseElement[], message?: string } {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'dxf') {
      return this.parseDxf(buf.toString('utf-8'));
    }
    
    if (extension === 'dwg') {
      // Logic for DWG -> DXF conversion would go here or using a specific converter service
      return { 
        rawEntities: [], 
        detectedElements: [], 
        message: 'DWG format detected. Elements will be extracted upon backend conversion processing.' 
      };
    }

    if (extension === 'pdf') {
       // Logic for PDF coordinate extraction
       return { 
         rawEntities: [], 
         detectedElements: [], 
         message: 'PDF format detected. Using as base layer overlay.' 
       };
    }

    throw new Error(`Unsupported file format: ${extension}`);
  }

  private parseDxf(dxfContent: string): { rawEntities: CadEntity[], detectedElements: DetectedWarehouseElement[] } {
    const parser = new DxfParser();
    const dxf = parser.parseSync(dxfContent);
    
    if (!dxf || !dxf.entities) {
      return { rawEntities: [], detectedElements: [] };
    }
    
    const entities: CadEntity[] = [];

    dxf.entities.forEach((ent: any) => {
      // Normalize entities to our CadEntity format
      entities.push({
        id: ent.handle,
        type: this.mapDxfType(ent.type),
        layer: ent.layer,
        points: ent.vertices || [],
        metadata: ent
      });
    });

    const detectedElements = this.detectElements(entities);

    return { rawEntities: entities, detectedElements };
  }

  private mapDxfType(type: string): 'line' | 'polyline' | 'rectangle' | 'text' {
    switch (type) {
      case 'LINE': return 'line';
      case 'LWPOLYLINE': return 'polyline';
      case 'TEXT': return 'text';
      default: return 'line';
    }
  }

  private detectElements(entities: CadEntity[]): DetectedWarehouseElement[] {
    const elements: DetectedWarehouseElement[] = [];
    
    // Heuristic 1: Layer-based detection
    entities.forEach(ent => {
      const layerUpper = ent.layer.toUpperCase();
      
      let elementType: DetectedWarehouseElement['type'] | null = null;
      if (layerUpper.includes('RACK')) elementType = 'rack';
      else if (layerUpper.includes('AISLE')) elementType = 'aisle';
      else if (layerUpper.includes('WALL')) elementType = 'wall';
      else if (layerUpper.includes('DOCK')) elementType = 'dock';
      
      if (elementType && (ent.type === 'polyline' || ent.type === 'rectangle')) {
        // Calculate rough bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        ent.points.forEach((p: any) => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        // Skip degenerate geometry
        if (minX === Infinity || maxX === -Infinity) return;

        elements.push({
          id: `det_${ent.id}`,
          type: elementType,
          layer: ent.layer || 'unknown',
          confidence: 0.9, // High confidence for layer matches
          geometry: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          },
          sourceEntities: [ent.id]
        });
      }
    });

    // Fallback Heuristics based on geometry if no explicit layers
    if (elements.length === 0) {
      entities.forEach(ent => {
        if (ent.type === 'polyline' || ent.type === 'rectangle') {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          ent.points.forEach((p: any) => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });
          const width = maxX - minX;
          const height = maxY - minY;

          // Heuristic: If it's long and narrow, it might be an aisle or a rack row
          if (width > 0 && height > 0) {
             const ratio = Math.max(width/height, height/width);
             if (ratio > 5 && width < 100 && height < 100) {
               elements.push({
                 id: `det_heur_${ent.id}`,
                 type: 'rack',
                 layer: ent.layer || 'unknown',
                 confidence: 0.6,
                 geometry: { x: minX, y: minY, width, height },
                 sourceEntities: [ent.id]
               });
             }
          }
        }
      });
    }

    return elements;
  }
}

