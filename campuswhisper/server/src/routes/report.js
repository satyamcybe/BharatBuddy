const express = require('express');
const { PrismaClient } = require('@prisma/client');
const messageStore = require('../redis/messageStore');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/report — file a report against a message
router.post('/', async (req, res) => {
  try {
    const { messageId, reason } = req.body;

    if (!messageId || !reason) {
      return res.status(400).json({ error: 'messageId and reason are required.' });
    }

    // Upsert: increment count if exists, create if not
    const existing = await prisma.report.findFirst({ where: { messageId } });

    let report;
    if (existing) {
      report = await prisma.report.update({
        where: { id: existing.id },
        data: { reportCount: { increment: 1 } },
      });
    } else {
      report = await prisma.report.create({
        data: { messageId, reason, reportCount: 1 },
      });
    }

    const reportCount = report.reportCount;

    // Auto-remove message when it hits 3 reports
    if (reportCount >= 3) {
      await messageStore.incrementReportCount(messageId);

      const io = req.app.get('io');
      if (io) {
        io.emit('message_removed', { messageId });
      }
    }

    res.json({ success: true, reportCount });
  } catch (err) {
    console.error('[Report] POST error:', err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

module.exports = router;
