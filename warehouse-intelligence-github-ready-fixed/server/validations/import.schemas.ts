import { z } from 'zod';

export const zoneImportSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['aisle', 'rack', 'dock', 'staging', 'pedestrian', 'charging', 'office', 'restricted', 'crossing', 'barrier', 'maintenance', 'buffer']),
  x: z.preprocess((val) => parseFloat(val as string), z.number()),
  y: z.preprocess((val) => parseFloat(val as string), z.number()),
  width: z.preprocess((val) => parseFloat(val as string), z.number().positive()),
  height: z.preprocess((val) => parseFloat(val as string), z.number().positive()),
  color: z.string().optional(),
});

export const eventImportSchema = z.object({
  type: z.string(),
  x: z.preprocess((val) => parseFloat(val as string), z.number()),
  y: z.preprocess((val) => parseFloat(val as string), z.number()),
  timestamp: z.string(),
  severity: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).max(10)),
  description: z.string().optional(),
});

export const laborImportSchema = z.object({
  operator_id: z.string(),
  activity_type: z.string(),
  start_time: z.string(),
  end_time: z.string().optional(),
  actual_picks: z.preprocess((val) => parseInt(val as string, 10), z.number()),
  expected_picks: z.preprocess((val) => parseInt(val as string, 10), z.number()),
});

export const observationImportSchema = z.object({
  type: z.enum(['safety', 'efficiency', 'hazard']),
  severity: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).max(10)),
  description: z.string(),
  timestamp: z.string(),
  status: z.enum(['open', 'reviewed', 'resolved']).optional(),
});

export const rackMasterSchema = z.object({
  location_code: z.string().min(1),
  aisle: z.string().optional(),
  level: z.string().optional(),
  position: z.string().optional(),
  zone_id: z.string().optional(),
});

export const benchmarkImportSchema = z.object({
  metric_key: z.string().min(1),
  value: z.preprocess((val) => parseFloat(val as string), z.number()),
  period: z.string(),
  compared_to_industry: z.preprocess((val) => parseFloat(val as string), z.number()).optional(),
});

export const routeTemplateImportSchema = z.object({
  name: z.string().min(1),
  start_node_id: z.string(),
  end_node_id: z.string(),
  equipment_type: z.string().optional(),
});

export const importSchemas: Record<string, z.ZodObject<any>> = {
  zones: zoneImportSchema,
  events: eventImportSchema,
  labor: laborImportSchema,
  observations: observationImportSchema,
  rack_master: rackMasterSchema,
  benchmarks: benchmarkImportSchema,
  route_templates: routeTemplateImportSchema,
};
