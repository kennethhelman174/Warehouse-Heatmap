import { BaseRepository } from './base.repository';

export class ImportRepository extends BaseRepository {
  getJobs() {
    return this.prepare('SELECT * FROM import_jobs ORDER BY created_at DESC').all();
  }

  createJob(job: any) {
    return this.prepare('INSERT INTO import_jobs (id, source_type, file_name, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(job.id, job.source_type, job.file_name, job.status, job.created_at);
  }

  updateJobStatus(id: string, status: string, successfulRows: number, failedRows: number = 0) {
    return this.prepare('UPDATE import_jobs SET status = ?, successful_rows = ?, failed_rows = ? WHERE id = ?')
      .run(status, successfulRows, failedRows, id);
  }

  addValidationError(error: any) {
    return this.prepare('INSERT INTO import_validation_errors (id, job_id, row_number, error_message, raw_data) VALUES (?, ?, ?, ?, ?)')
      .run(Date.now().toString() + Math.random(), error.jobId, error.rowNumber, error.message, JSON.stringify(error.rawData));
  }

  addStagingRow(jobId: string, rowNumber: number, data: any) {
    return this.prepare('INSERT INTO import_staging_rows (id, job_id, row_number, data_json, status) VALUES (?, ?, ?, ?, ?)')
      .run(Date.now().toString() + Math.random(), jobId, rowNumber, JSON.stringify(data), 'pending');
  }

  getStagingRows(jobId: string) {
    return this.prepare('SELECT * FROM import_staging_rows WHERE job_id = ?').all(jobId);
  }

  getValidationErrors(jobId: string) {
    return this.prepare('SELECT * FROM import_validation_errors WHERE job_id = ?').all(jobId);
  }

  clearStaging(jobId: string) {
    return this.prepare('DELETE FROM import_staging_rows WHERE job_id = ?').run(jobId);
  }

  getJob(id: string) {
    return this.prepare('SELECT * FROM import_jobs WHERE id = ?').get(id);
  }

  setTotalRows(id: string, total: number) {
    return this.prepare('UPDATE import_jobs SET total_rows = ? WHERE id = ?').run(total, id);
  }
}

export class AuditRepository extends BaseRepository {
  log(userId: string, action: string, resourceType: string, resourceId?: string, details?: any) {
    return this.prepare('INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(Date.now().toString(), userId, action, resourceType, resourceId || null, details ? JSON.stringify(details) : null, new Date().toISOString());
  }

  getLogs(filters: any = {}) {
    let query = 'SELECT * FROM audit_logs';
    const params = [];
    if (filters.userId) {
      query += ' WHERE user_id = ?';
      params.push(filters.userId);
    }
    query += ' ORDER BY timestamp DESC LIMIT 100';
    return this.prepare(query).all(...params);
  }
}
