import fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { ImportRepository, AuditRepository } from '../repositories/audit.repository';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { AppError } from '../middleware/error.middleware';
import { importSchemas } from '../validations/import.schemas';

const importRepo = new ImportRepository();
const warehouseRepo = new WarehouseRepository();
const auditRepo = new AuditRepository();

export class ImportService {
  async getJobs() {
    const raw = importRepo.getJobs() as any[];
    return raw.map(j => ({
      id: j.id,
      sourceType: j.source_type,
      fileName: j.file_name,
      status: j.status,
      totalRows: j.total_rows,
      successfulRows: j.successful_rows,
      failedRows: j.failed_rows,
      createdAt: j.created_at
    }));
  }

  async getJobDetails(jobId: string) {
    const rawJob = importRepo.getJob(jobId) as any;
    if (!rawJob) throw new AppError('Job not found', 404);
    
    const job = {
      id: rawJob.id,
      sourceType: rawJob.source_type,
      fileName: rawJob.file_name,
      status: rawJob.status,
      totalRows: rawJob.total_rows,
      successfulRows: rawJob.successful_rows,
      failedRows: rawJob.failed_rows,
      createdAt: rawJob.created_at
    };

    const rawErrors = importRepo.getValidationErrors(jobId) as any[];
    const errors = rawErrors.map(e => ({
      id: e.id,
      jobId: e.job_id,
      rowNumber: e.row_number,
      errorMessage: e.error_message,
      rawData: e.raw_data
    }));

    const rawStaging = importRepo.getStagingRows(jobId) as any[];
    const staging = rawStaging.map(s => ({
      id: s.id,
      jobId: s.job_id,
      rowNumber: s.row_number,
      dataJson: s.data_json,
      status: s.status
    }));
    
    return { job, errors, staging };
  }

  async processFile(jobId: string, sourceType: string, filePath: string, originalName: string) {
    const isExcel = originalName.toLowerCase().endsWith('.xlsx') || 
                    originalName.toLowerCase().endsWith('.xls') ||
                    originalName.toLowerCase().endsWith('.csv') === false; // Default to XLSX if unsure but not .csv
    
    try {
      await importRepo.updateJobStatus(jobId, 'processing', 0, 0);

      const schema = importSchemas[sourceType];
      if (!schema) throw new AppError(`No validation schema for ${sourceType}`, 400);

      let rows: any[] = [];
      if (isExcel) {
        const workbook = XLSX.readFile(filePath);
        if (workbook.SheetNames.length === 0) {
          throw new AppError('The Excel file contains no sheets.', 400);
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      } else {
        rows = await this.parseCsv(filePath);
      }

      if (rows.length === 0) {
        await importRepo.updateJobStatus(jobId, 'empty_file', 0, 0);
        return { successful: 0, failed: 0 };
      }

      // Set total rows for tracking
      importRepo.setTotalRows(jobId, rows.length);

      let successful = 0;
      let failed = 0;

      for (const [index, row] of rows.entries()) {
        const result = schema.safeParse(row);
        if (!result.success) {
          const errorMsg = result.error.issues
            .map(e => `Field '${e.path.join('.')}': ${e.message}`)
            .join(' | ');
          
          importRepo.addValidationError({
            jobId,
            rowNumber: index + 1,
            message: errorMsg,
            rawData: row
          });
          failed++;
        } else {
          importRepo.addStagingRow(jobId, index + 1, result.data);
          successful++;
        }
      }

      const finalStatus = failed === 0 ? 'staged' : (successful > 0 ? 'partial_validation' : 'failed_validation');
      await importRepo.updateJobStatus(jobId, finalStatus, successful, failed);
      
      return { successful, failed };
    } catch (err: any) {
      console.error('Import processing failed:', err);
      const errorMessage = err instanceof AppError ? err.message : 'System processing error';
      await importRepo.updateJobStatus(jobId, 'error', 0, 0);
      // Log the error as a validation error potentially or update job notes
      throw err;
    } finally {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to delete temp file:', filePath, e);
        }
      }
    }
  }

  private parseCsv(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', reject)
        .on('end', () => resolve(results));
    });
  }

  async commitJob(userId: string, jobId: string, facilityId: string, versionId?: string) {
    const job: any = importRepo.getJob(jobId);
    if (!job) throw new AppError('Job not found', 404);
    if (job.status !== 'staged' && job.status !== 'failed_validation') {
      throw new AppError('Job is not in a committable state', 400);
    }

    const stagingRows = importRepo.getStagingRows(jobId) as any[];
    let committedCount = 0;

    // Transactional commit (simplified for this context)
    for (const row of stagingRows) {
      const data = JSON.parse(row.data_json);
      await this.insertData(job.source_type, data, facilityId, versionId);
      committedCount++;
    }

    await importRepo.updateJobStatus(jobId, 'completed', committedCount, job.failed_rows);
    await importRepo.clearStaging(jobId);
    
    auditRepo.log(userId, 'COMMIT_IMPORT', 'import_job', jobId, { 
      source_type: job.source_type, 
      rows: committedCount 
    });

    return { committedCount };
  }

  private async insertData(type: string, data: any, facilityId: string, versionId?: string) {
    const id = `${type.substring(0, 1)}-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    switch (type) {
      case 'zones':
        if (!versionId) throw new AppError('Version ID required for zone import', 400);
        warehouseRepo.createZone({ 
          ...data, 
          id, 
          version_id: versionId,
          metadata_json: JSON.stringify(data.metadata || {})
        });
        break;
      case 'events':
        warehouseRepo.createEvent({ ...data, id });
        break;
      case 'observations':
        warehouseRepo.createObservation({
          ...data,
          id,
          facility_id: facilityId,
          status: data.status || 'open'
        });
        break;
      case 'labor':
        warehouseRepo.createLaborRecord({ ...data, id, facility_id: facilityId });
        break;
      case 'benchmarks':
        warehouseRepo.createBenchmark({ ...data, id, facility_id: facilityId });
        break;
      case 'route_templates':
        if (!versionId) throw new AppError('Version ID required for route template import', 400);
        warehouseRepo.createRouteTemplate({ ...data, id, facility_id: facilityId, version_id: versionId });
        break;
    }
  }

  async createJob(userId: string, data: any) {
    if (!data.sourceType || !importSchemas[data.sourceType]) {
      throw new AppError(`Invalid or missing source type. Supported types: ${Object.keys(importSchemas).join(', ')}`, 400);
    }

    const job = {
      id: `job-${Date.now()}`,
      source_type: data.sourceType,
      file_name: data.fileName,
      status: 'uploading',
      created_at: new Date().toISOString()
    };
    importRepo.createJob(job);
    auditRepo.log(userId, 'CREATE_IMPORT_JOB', 'import_job', job.id, { 
      source_type: data.sourceType, 
      file_name: data.fileName 
    });
    return job;
  }
}
