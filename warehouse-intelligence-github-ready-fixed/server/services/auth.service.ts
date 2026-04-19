import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { env } from '../config/env';

const userRepository = new UserRepository();

export class AuthService {
  async login(email: string, password: string) {
    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found. Check email or contact site administrator.', 401);
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new AppError('Invalid password.', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    };
  }

  async register(data: any) {
    const existing = userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('User already exists');
    }

    const hashedPassword = bcrypt.hashSync(data.password, 10);
    const user = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'Viewer' // Always default to Viewer for safety; Admin roles must be assigned via DB or internal tools
    };

    userRepository.create(user);
    return { message: 'User created' };
  }

  async getMe(id: string) {
    const user = userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }
}
