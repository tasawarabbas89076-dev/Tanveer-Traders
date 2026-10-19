/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Full-Stack Express Server for Tanveer Traders
 * Serving HTML5 frontend, REST APIs, and Supabase integration
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import { handleGetProducts, handleGetProductById } from './api/products.js';
import { handleCreateOrder } from './api/orders.js';
import {
  handleAdminGetProducts,
  handleAdminCreateProduct,
  handleAdminUpdateProduct,
  handleAdminDeleteProduct
} from './api/admin/products.js';
import { handleAdminGetOrders, handleAdminUpdateOrderStatus } from './api/admin/orders.js';
import { handleGetSettings, handleUpdateSettings } from './api/admin/settings.js';
import { authenticateAdmin, requireAdminAuth, verifyToken } from './lib/auth.js';
import { supabase } from './lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing with safe size limit
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

// Security Headers (allow embedding in AI Studio preview iframe)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Serve static assets directly
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/src/assets', express.static(path.join(__dirname, 'src/assets')));

// Serve root static files like robots.txt, sitemap.xml, favicon.svg
app.get('/favicon.svg', (_req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));
app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));
app.get('/robots.txt', (_req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (_req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));

// ============================================================
// Public REST API Routes
// ============================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Tanveer Traders API', timestamp: new Date().toISOString() });
});

// Products
app.get('/api/products', handleGetProducts);
app.get('/api/products/:id', handleGetProductById);

// Public Order Submission
app.post('/api/orders', handleCreateOrder);

// Store Settings (Public view)
app.get('/api/settings', handleGetSettings);

// ============================================================
// Admin Authentication Routes
// ============================================================

app.post('/api/admin/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const result = await authenticateAdmin(email, password, supabase as any);
  if (!result.success) {
    return res.status(401).json({ success: false, error: result.message || 'Invalid credentials' });
  }

  return res.status(200).json({
    success: true,
    message: 'Authentication successful',
    token: result.token,
    user: result.user
  });
});

app.get('/api/admin/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, user: payload });
});

app.post('/api/admin/auth/logout', (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ============================================================
// Protected Admin API Routes (Require Bearer Token)
// ============================================================

app.get('/api/admin/products', requireAdminAuth, handleAdminGetProducts);
app.post('/api/admin/products', requireAdminAuth, handleAdminCreateProduct);
app.patch('/api/admin/products/:id', requireAdminAuth, handleAdminUpdateProduct);
app.delete('/api/admin/products/:id', requireAdminAuth, handleAdminDeleteProduct);

app.get('/api/admin/orders', requireAdminAuth, handleAdminGetOrders);
app.patch('/api/admin/orders/:id', requireAdminAuth, handleAdminUpdateOrderStatus);

app.get('/api/admin/settings', requireAdminAuth, handleGetSettings);
app.patch('/api/admin/settings', requireAdminAuth, handleUpdateSettings);

// Clean admin page URL routing
app.get('/admin/login', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'admin/login.html'));
});

app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

app.get('/products', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'products.html'));
});

// Setup dev server with Vite or production static file serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    // Helper to serve transformed HTML
    const serveHtml = async (filePath: string, req: Request, res: Response) => {
      try {
        let template = fs.readFileSync(filePath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=UTF-8' }).end(template);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        res.sendFile(filePath);
      }
    };

    // Clean page routes
    app.get('/', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'index.html'), req, res));
    app.get('/index.html', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'index.html'), req, res));
    app.get('/products', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'products.html'), req, res));
    app.get('/products.html', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'products.html'), req, res));
    app.get('/admin', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'admin/index.html'), req, res));
    app.get('/admin/index.html', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'admin/index.html'), req, res));
    app.get('/admin/login', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'admin/login.html'), req, res));
    app.get('/admin/login.html', (req: Request, res: Response) => serveHtml(path.join(__dirname, 'admin/login.html'), req, res));

    // Fallback for html pages in dev
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl.split('?')[0];

      try {
        if (url === '/' || url === '/index.html') {
          return serveHtml(path.join(__dirname, 'index.html'), req, res);
        }
        if (url === '/products' || url === '/products.html') {
          return serveHtml(path.join(__dirname, 'products.html'), req, res);
        }
        if (url === '/admin' || url === '/admin/' || url === '/admin/index.html') {
          return serveHtml(path.join(__dirname, 'admin/index.html'), req, res);
        }
        if (url === '/admin/login' || url === '/admin/login.html') {
          return serveHtml(path.join(__dirname, 'admin/login.html'), req, res);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
  } else {
    // Production: serve built static files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      const url = req.path;
      if (url.startsWith('/admin/login')) {
        return res.sendFile(path.join(__dirname, 'dist/admin/login.html'));
      }
      if (url.startsWith('/admin')) {
        return res.sendFile(path.join(__dirname, 'dist/admin/index.html'));
      }
      if (url.startsWith('/products')) {
        return res.sendFile(path.join(__dirname, 'dist/products.html'));
      }
      return res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tanveer Traders server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
