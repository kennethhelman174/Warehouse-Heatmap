import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['Admin', 'Engineer', 'Operator', 'Viewer']).optional(),
  }),
});

export const facilitySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
    description: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const versionSchema = z.object({
  body: z.object({
    facilityId: z.string().uuid().or(z.string().min(1)),
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
  }),
});

export const zoneSchema = z.object({
  body: z.object({
    versionId: z.string().min(1),
    name: z.string().min(1),
    type: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    color: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export const eventSchema = z.object({
  body: z.object({
    type: z.string().min(1),
    x: z.number(),
    y: z.number(),
    timestamp: z.string().datetime().or(z.string().min(1)),
    severity: z.number().min(1).max(10),
    description: z.string().optional(),
    zoneId: z.string().optional(),
    actionId: z.string().optional(),
    facilityId: z.string().optional(),
  }),
});

export const observationSchema = z.object({
  body: z.object({
    facilityId: z.string().min(1),
    type: z.string().min(1),
    severity: z.number().min(1).max(10),
    x: z.number(),
    y: z.number(),
    description: z.string().optional(),
    zoneId: z.string().optional(),
    nodeId: z.string().optional(),
  }),
});

export const nodeSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    versionId: z.string().min(1),
    x: z.number(),
    y: z.number(),
    type: z.enum(['standard', 'intersection', 'dock_door', 'rack_face', 'charging_station', 'checkpoint', 'safety_stop', 'crossing_point', 'entry_exit', 'restricted_entry', 'hazard_point']).optional(),
    allowedTraffic: z.enum(['pedestrian', 'forklift', 'both']).optional(),
    zoneId: z.string().optional(),
  }),
});

export const edgeSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    versionId: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    type: z.enum(['forklift', 'pedestrian', 'shared']).default('forklift'),
    isOneWay: z.boolean().optional(),
    weight: z.number().positive().default(1),
    speedLimit: z.number().optional(),
  }),
});

export const actionItemSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    status: z.enum(['Open', 'In Progress', 'Completed', 'Verified']).default('Open'),
    owner: z.string().min(1, 'Owner is required'),
    dueDate: z.string().optional().nullable(),
    category: z.string().optional(),
    observationId: z.string().optional().nullable(),
    zone: z.string().optional(),
  }),
});

export const updateActionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Open', 'In Progress', 'Completed', 'Verified']),
  }),
});

export const routeSaveSchema = z.object({
  body: z.object({
    facilityId: z.string().min(1),
    versionId: z.string().min(1),
    name: z.string().min(1),
    path: z.array(z.object({
      x: z.number(),
      y: z.number(),
    })).min(1),
    metrics: z.record(z.string(), z.any()).optional(),
  }),
});

export const engineeringAnalysisSchema = z.object({
  body: z.object({
    facilityId: z.string().min(1),
    versionId: z.string().min(1),
    type: z.enum(['EHS', 'IE']),
  }),
});

export const engineeringVerificationSchema = z.object({
  body: z.object({
    score: z.number().min(1).max(10),
    notes: z.string().min(5),
  }),
});

export const importCommitSchema = z.object({
  body: z.object({
    facilityId: z.string().min(1),
    versionId: z.string().optional(),
  }),
});
