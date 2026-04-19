import { Request, Response } from 'express';
import { WarehouseService } from '../services/warehouse.service';
import { asyncHandler } from '../middleware/error.middleware';

const warehouseService = new WarehouseService();

export const getFacilities = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getFacilities();
  res.json(result);
});

export const updateFacility = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.updateFacility(userId, req.params.id, req.body);
  res.json(result);
});

export const getVersions = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getVersions(req.params.id);
  res.json(result);
});

export const createVersion = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createVersion(userId, req.params.id, req.body);
  res.status(201).json(result);
});

export const getZones = asyncHandler(async (req: Request, res: Response) => {
  const versionId = req.query.versionId as string;
  const result = await warehouseService.getZones(versionId);
  res.json(result);
});

export const getRacks = asyncHandler(async (req: Request, res: Response) => {
  const zoneId = req.query.zoneId as string;
  const result = await warehouseService.getRacks(zoneId);
  res.json(result);
});

export const getLocationStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getLocationStats(req.params.id);
  res.json(result);
});

export const createRack = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createRack(userId, req.body);
  res.status(201).json(result);
});

export const createNode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createNode(userId, req.body);
  res.status(201).json(result);
});

export const updateNode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.updateNode(userId, req.params.id, req.body);
  res.json(result);
});

export const deleteNode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await warehouseService.deleteNode(userId, req.params.id);
  res.status(204).send();
});

export const createEdge = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createEdge(userId, req.body);
  res.status(201).json(result);
});

export const deleteEdge = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await warehouseService.deleteEdge(userId, req.params.id);
  res.status(204).send();
});

export const createZone = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createZone(userId, req.body);
  res.status(201).json(result);
});

export const updateZone = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.updateZone(userId, req.params.id, req.body);
  res.json(result);
});

export const deleteZone = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await warehouseService.deleteZone(userId, req.params.id);
  res.status(204).send();
});

export const getNetwork = asyncHandler(async (req: Request, res: Response) => {
  const versionId = req.query.versionId as string;
  const result = await warehouseService.getNetwork(versionId);
  res.json(result);
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getEvents(facilityId);
  res.json(result);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createEvent(userId, req.body);
  res.status(201).json(result);
});

export const getObservations = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getObservations(facilityId);
  res.json(result);
});

export const createObservation = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createObservation(userId, req.body);
  res.status(201).json(result);
});

export const getActions = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getActions();
  res.json(result);
});

export const createAction = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.createAction(userId, req.body);
  res.status(201).json(result);
});

export const updateAction = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await warehouseService.updateActionStatus(userId, req.params.id, req.body.status);
  res.json({ success: true });
});

export const getSavedRoutes = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const versionId = req.query.versionId as string;
  const result = await warehouseService.getSavedRoutes(facilityId, versionId);
  res.json(result);
});

export const saveRoute = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await warehouseService.saveRoute(userId, req.body);
  res.status(201).json(result);
});

export const getScenarios = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getScenarios(facilityId);
  res.json(result);
});

export const getScenarioRuns = asyncHandler(async (req: Request, res: Response) => {
  const scenarioId = req.params.id;
  const result = await warehouseService.getScenarioRuns(scenarioId);
  res.json(result);
});

export const getLaborRecords = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getLaborRecords(facilityId);
  res.json(result);
});

export const getLaborPlans = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getLaborPlans(facilityId);
  res.json(result);
});

export const getCostAssumptions = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getCostAssumptions(facilityId);
  res.json(result);
});

export const getBenchmarks = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  const result = await warehouseService.getBenchmarks(facilityId);
  res.json(result);
});
