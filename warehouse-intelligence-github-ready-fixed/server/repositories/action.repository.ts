import { BaseRepository } from './base.repository';

export class ActionRepository extends BaseRepository {
  getActions(facilityId?: string) {
    if (facilityId) {
      return this.prepare(`
        SELECT a.* 
        FROM action_items a
        JOIN observations o ON a.observation_id = o.id
        WHERE o.facility_id = ?
      `).all(facilityId);
    }
    return this.prepare('SELECT * FROM action_items').all();
  }

  createAction(action: any) {
    return this.prepare('INSERT INTO action_items (id, observation_id, title, description, zone, category, owner, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(action.id, action.observation_id, action.title, action.description, action.zone, action.category, action.owner, action.priority, action.due_date, action.status);
  }

  updateActionStatus(id: string, status: string, userId: string, comment?: string) {
    const action = this.prepare('SELECT status FROM action_items WHERE id = ?').get(id) as any;
    if (!action) return null;

    return this.transaction(() => {
      this.prepare('UPDATE action_items SET status = ? WHERE id = ?').run(status, id);
      this.prepare('INSERT INTO action_history (id, action_item_id, status_from, status_to, comment, updated_by) VALUES (?, ?, ?, ?, ?, ?)')
        .run(`hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, id, action.status, status, comment, userId);
    });
  }

  verifyAction(id: string, verifiedBy: string, score: number, notes: string) {
    return this.prepare(`
      UPDATE action_items 
      SET verified_at = CURRENT_TIMESTAMP, 
          verified_by = ?, 
          effectiveness_score = ?, 
          effectiveness_notes = ?,
          status = 'Verified'
      WHERE id = ?
    `).run(verifiedBy, score, notes, id);
  }

  getActionsByObservation(observationId: string) {
    return this.prepare('SELECT * FROM action_items WHERE observation_id = ?').all(observationId);
  }

  getHistory(actionItemId: string) {
    return this.prepare('SELECT * FROM action_history WHERE action_item_id = ? ORDER BY timestamp DESC').all(actionItemId);
  }

  getOpenActionCount(facilityId?: string) {
    if (facilityId) {
       return (this.prepare(`
        SELECT COUNT(*) as count 
        FROM action_items a
        JOIN observations o ON a.observation_id = o.id
        WHERE a.status = 'Open' AND o.facility_id = ?
      `).get(facilityId) as any).count;
    }
    return (this.prepare("SELECT COUNT(*) as count FROM action_items WHERE status = 'Open'").get() as any).count;
  }
}

export class RouteRepository extends BaseRepository {
  getSavedRoutes() {
    return this.prepare('SELECT * FROM saved_routes').all();
  }

  saveRoute(route: any) {
    return this.prepare('INSERT INTO saved_routes (id, name, path_json, created_at) VALUES (?, ?, ?, ?)')
      .run(route.id, route.name, route.path_json, route.created_at);
  }
}
