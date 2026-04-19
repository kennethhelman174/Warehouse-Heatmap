import { Router } from 'express';
import * as WarehouseController from '../controllers/warehouse.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { 
  zoneSchema, eventSchema, nodeSchema, edgeSchema, 
  actionItemSchema, updateActionStatusSchema, routeSaveSchema,
  facilitySchema, versionSchema, observationSchema
} from '../validations/schemas';

const router = Router();

router.use(authenticate);

router.get('/facilities', WarehouseController.getFacilities);
router.put('/facilities/:id', authorize(['Admin']), validate(facilitySchema), WarehouseController.updateFacility);
router.get('/facilities/:id/versions', WarehouseController.getVersions);
router.post('/facilities/:id/versions', authorize(['Admin', 'Engineer']), validate(versionSchema), WarehouseController.createVersion);
router.get('/zones', WarehouseController.getZones);
router.get('/racks', WarehouseController.getRacks);
router.get('/location-stats/:id', WarehouseController.getLocationStats);
router.post('/racks', authorize(['Admin', 'Engineer']), WarehouseController.createRack);
router.get('/map-network', WarehouseController.getNetwork);

router.post('/network/nodes', authorize(['Admin', 'Engineer']), validate(nodeSchema), WarehouseController.createNode);
router.put('/network/nodes/:id', authorize(['Admin', 'Engineer']), WarehouseController.updateNode);
router.delete('/network/nodes/:id', authorize(['Admin', 'Engineer']), WarehouseController.deleteNode);
router.post('/network/edges', authorize(['Admin', 'Engineer']), validate(edgeSchema), WarehouseController.createEdge);
router.delete('/network/edges/:id', authorize(['Admin', 'Engineer']), WarehouseController.deleteEdge);

router.get('/events', WarehouseController.getEvents);
router.get('/observations', WarehouseController.getObservations);
router.post('/observations', validate(observationSchema), WarehouseController.createObservation);
router.get('/actions', WarehouseController.getActions);
router.get('/saved-routes', WarehouseController.getSavedRoutes);

router.post('/zones', authorize(['Admin', 'Engineer']), validate(zoneSchema), WarehouseController.createZone);
router.put('/zones/:id', authorize(['Admin', 'Engineer']), validate(zoneSchema), WarehouseController.updateZone);
router.delete('/zones/:id', authorize(['Admin']), WarehouseController.deleteZone);

router.post('/events', authorize(['Admin', 'Engineer', 'Operator']), validate(eventSchema), WarehouseController.createEvent);

router.post('/actions', authorize(['Admin', 'Engineer']), validate(actionItemSchema), WarehouseController.createAction);
router.patch('/actions/:id', authorize(['Admin', 'Engineer', 'Operator']), validate(updateActionStatusSchema), WarehouseController.updateAction);

router.post('/saved-routes', authorize(['Admin', 'Engineer']), validate(routeSaveSchema), WarehouseController.saveRoute);

// Simulation & Planning
router.get('/scenarios', WarehouseController.getScenarios);
router.get('/scenarios/:id/runs', WarehouseController.getScenarioRuns);
router.get('/labor/records', WarehouseController.getLaborRecords);
router.get('/labor/plans', WarehouseController.getLaborPlans);
router.get('/finance/assumptions', WarehouseController.getCostAssumptions);
router.get('/finance/benchmarks', WarehouseController.getBenchmarks);

export default router;
