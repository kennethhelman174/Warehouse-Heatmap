import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  findByEmail(email: string) {
    return this.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  }

  findById(id: string) {
    return this.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  }

  create(user: any) {
    return this.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, user.name, user.email, user.password, user.role);
  }

  count() {
    return (this.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  }
}
