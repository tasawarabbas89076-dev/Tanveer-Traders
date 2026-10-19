/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function Entry Point
 */

import express from 'express';
import { handleGetProducts, handleGetProductById } from './products.js';
import { handleCreateOrder } from './orders.js';
import {
  handleAdminGetProducts,
  handleAdminCreateProduct,
  handleAdminUpdateProduct,
  handleAdminDeleteProduct
} from './admin/products.js';
import { handleAdminGetOrders, handleAdminUpdateOrderStatus } from './admin/orders.js';
import { handleGetSettings, handleUpdateSettings } from './admin/settings.js';
import { authenticateAdmin, requireAdminAuth, verifyToken } from '../lib/auth.js';
import { supabase } from '../lib/supabase.js';

const app = express();
app.use(express.json({ limit: '512kb' }));

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Public APIs
app.get('/api/products', handleGetProducts);
app.get('/api/products/:id', handleGetProductById);
app.post('/api/orders', handleCreateOrder);
app.get('/api/settings', handleGetSettings);

// Admin Auth
app.post('/api/admin/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  const result = await authenticateAdmin(email, password, supabase);
  if (!result.success) {
    return res.status(401).json({ success: false, error: result.message || 'Invalid credentials' });
  }
  return res.status(200).json({ success: true, token: result.token, user: result.user });
});

app.get('/api/admin/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ authenticated: false });
  const token = auth.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, user: payload });
});

// Admin Protected
app.get('/api/admin/products', requireAdminAuth, handleAdminGetProducts);
app.post('/api/admin/products', requireAdminAuth, handleAdminCreateProduct);
app.patch('/api/admin/products/:id', requireAdminAuth, handleAdminUpdateProduct);
app.delete('/api/admin/products/:id', requireAdminAuth, handleAdminDeleteProduct);

app.get('/api/admin/orders', requireAdminAuth, handleAdminGetOrders);
app.patch('/api/admin/orders/:id', requireAdminAuth, handleAdminUpdateOrderStatus);

app.get('/api/admin/settings', requireAdminAuth, handleGetSettings);
app.patch('/api/admin/settings', requireAdminAuth, handleUpdateSettings);

export default app;
