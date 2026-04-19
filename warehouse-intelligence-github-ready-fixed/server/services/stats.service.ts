import { WarehouseRepository } from '../repositories/warehouse.repository';
import { ActionRepository } from '../repositories/action.repository';
import { CadParserService } from '../../src/services/cad/parser';
import { AuditRepository } from '../repositories/audit.repository';

const warehouseRepo = new WarehouseRepository();
const actionRepo = new ActionRepository();
const auditRepo = new AuditRepository();
const cadParser = new CadParserService();

export class StatsService {
  async getDashboardStats(facilityId?: string) {
    const nearMisses = warehouseRepo.getEventCountByType('near_miss', facilityId);
    const incidents = warehouseRepo.getEventCountByType('incident', facilityId);
    const openActions = actionRepo.getOpenActionCount(facilityId);
    
    const zoneCount = warehouseRepo.countEntities('zones', facilityId);
    
    const safetyTrends = warehouseRepo.getSafetyTrends(facilityId);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedTrends = safetyTrends.map((t: any) => ({
      name: days[parseInt(t.day_of_week)],
      incidents: t.incidents,
      nearMisses: t.nearMisses
    }));

    const recentEvents = warehouseRepo.getRecentEvents(5, facilityId);

    return {
      nearMisses,
      incidents,
      openActions,
      totalZones: zoneCount,
      trends: formattedTrends,
      recentEvents
    };
  }
}

export class CadService {
  async processUpload(userId: string, filename: string, buf: Buffer) {
    const result = cadParser.parseFile(userId, filename, buf);
    auditRepo.log(userId, 'UPLOAD_MAP', 'cad_file', filename, { filename });
    return result;
  }
}
