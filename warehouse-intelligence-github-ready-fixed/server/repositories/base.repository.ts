import { getDb } from '../../src/lib/db.js';

export class BaseRepository {
  protected get db() {
    return getDb();
  }

  protected prepare(sql: string) {
    return this.db.prepare(sql);
  }

  protected transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}
