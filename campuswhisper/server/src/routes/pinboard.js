const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/pinboard/:roomId — list active resources sorted by votes
router.get('/:roomId', apiLimiter, async (req, res) => {
  try {
    const { roomId } = req.params;
    const resources = await prisma.resource.findMany({
      where: {
        roomId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { votes: 'desc' },
    });
    res.json(resources);
  } catch (err) {
    console.error('[Pinboard] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
});

// POST /api/pinboard — create a new resource
router.post('/', apiLimiter, async (req, res) => {
  try {
    const { roomId, title, url, tag, pinnedBy } = req.body;

    if (!roomId || !title || !url || !tag || !pinnedBy) {
      return res.status(400).json({ error: 'Missing required fields: roomId, title, url, tag, pinnedBy.' });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const resource = await prisma.resource.create({
      data: { roomId, title, url, tag, pinnedBy, expiresAt },
    });

    res.status(201).json(resource);
  } catch (err) {
    console.error('[Pinboard] POST error:', err);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
});

// POST /api/pinboard/:id/upvote — increment vote count
router.post('/:id/upvote', apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.update({
      where: { id },
      data: { votes: { increment: 1 } },
    });

    res.json(resource);
  } catch (err) {
    console.error('[Pinboard] UPVOTE error:', err);
    res.status(500).json({ error: 'Failed to upvote resource.' });
  }
});

// DELETE /api/pinboard/:id — delete if pinnedBy matches
router.delete('/:id', apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'sessionToken is required.' });
    }

    const resource = await prisma.resource.findUnique({ where: { id } });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    if (resource.pinnedBy !== sessionToken) {
      return res.status(403).json({ error: 'Not authorized to delete this resource.' });
    }

    await prisma.resource.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Pinboard] DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

module.exports = router;
