declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: 'Admin' | 'Engineer' | 'Operator' | 'Viewer';
    };
  }
}
