import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './server/routes/index';
import { errorHandler } from './server/middleware/error.middleware';
import { bootstrap } from './server/database/bootstrap';
import { env } from './server/config/env';
import { apiLimiter } from './server/middleware/rate-limiter.middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  
  // Set proxy trust so rate-limiters work correctly behind ingress reverse proxies
  app.set('trust proxy', 1);
  
  // 1. Initial configuration
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Global Rate Limiting
  app.use('/api', apiLimiter);
  
  // 3. System Bootstrap (Seeded if necessary)
  bootstrap();

  // 4. API Routes
  app.use('/api', apiRoutes);

  // 4. Centralized Error Handling
  app.use(errorHandler);

  // 5. Frontend / Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist/client');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Start Listener
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Warehouse Intelligence Backend running on http://localhost:${env.PORT} (env: ${env.NODE_ENV})`);
  });
}

startServer();
