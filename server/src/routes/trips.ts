import { Router } from 'express';
import db from '../services/database.js';

export const tripsRouter = Router();

tripsRouter.get('/', (req, res) => {
  const userId = req.user!.id;
  const trips = db.prepare(
    'SELECT id, trip_name, created_at, updated_at FROM trips WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(userId);
  res.json({ trips });
});

tripsRouter.get('/:id', (req, res) => {
  const userId = req.user!.id;
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(
    Number(req.params.id), userId
  ) as Record<string, unknown> | undefined;

  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  res.json({
    trip: {
      id: trip.id,
      tripName: trip.trip_name,
      columns: JSON.parse(trip.columns_json as string),
      columnOrder: JSON.parse(trip.column_order_json as string),
      items: JSON.parse(trip.items_json as string),
      createdAt: trip.created_at,
      updatedAt: trip.updated_at,
    },
  });
});

tripsRouter.post('/', (req, res) => {
  const userId = req.user!.id;
  const { tripName, columns, columnOrder, items } = req.body;
  const now = new Date().toISOString();

  const info = db.prepare(
    'INSERT INTO trips (user_id, trip_name, columns_json, column_order_json, items_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    userId,
    tripName || 'My Trip',
    JSON.stringify(columns || {}),
    JSON.stringify(columnOrder || []),
    JSON.stringify(items || {}),
    now,
    now
  );

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

tripsRouter.put('/:id', (req, res) => {
  const userId = req.user!.id;
  const tripId = Number(req.params.id);
  const { tripName, columns, columnOrder, items } = req.body;
  const now = new Date().toISOString();

  const result = db.prepare(
    'UPDATE trips SET trip_name = ?, columns_json = ?, column_order_json = ?, items_json = ?, updated_at = ? WHERE id = ? AND user_id = ?'
  ).run(
    tripName,
    JSON.stringify(columns),
    JSON.stringify(columnOrder),
    JSON.stringify(items),
    now,
    tripId,
    userId
  );

  if (result.changes === 0) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  res.json({ ok: true });
});

tripsRouter.delete('/:id', (req, res) => {
  const userId = req.user!.id;
  const tripId = Number(req.params.id);

  const result = db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').run(tripId, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  res.json({ ok: true });
});
