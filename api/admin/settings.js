/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Store Settings API Handler
 */

import { dbGetSettings, dbUpdateSettings } from '../../lib/supabase.js';
import { validateSettingsInput } from '../../lib/validation.js';

export async function handleGetSettings(req, res) {
  try {
    const settings = await dbGetSettings();
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve store settings' });
  }
}

export async function handleUpdateSettings(req, res) {
  try {
    const validation = validateSettingsInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const updated = await dbUpdateSettings(validation.data);
    return res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to update store settings' });
  }
}
