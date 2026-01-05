require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

/* -------------------- CORS (FIXED) -------------------- */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

/* -------------------- Body parser -------------------- */
app.use(express.json());


/* -------------------- Env vars -------------------- */
const GMAIL_USER = process.env.GMAIL_USER; // ummehani.arts@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('❌ Missing Gmail env variables');
  process.exit(1);
}

/* -------------------- Nodemailer transporter -------------------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

/* -------------------- Health check -------------------- */
app.get('/', (req, res) => {
  res.send('✅ Newsletter server is running');
});

/* -------------------- Newsletter API -------------------- */
app.post('/api/newsletter', async (req, res) => {
  const { subject, html, recipients } = req.body;

  if (!subject || !html || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'subject, html, recipients required' });
  }

  try {
    const results = await Promise.all(
      recipients.map(email =>
        transporter.sendMail({
          from: `"Umme Hani" <${GMAIL_USER}>`,
          to: email,
          replyTo: `"Umme Hani" <${GMAIL_USER}>`,
          subject,
          html
        })
        .then(() => ({ email, status: 'sent' }))
        .catch(err => ({ email, status: 'failed', error: err.message }))
      )
    );

    const sent = results.filter(r => r.status === 'sent').map(r => r.email);
    const failed = results.filter(r => r.status === 'failed');

    console.log('📧 Sent:', sent);
    if (failed.length) console.error('❌ Failed:', failed);

    res.json({ ok: true, sent, failed });

  } catch (err) {
    console.error('🔥 Newsletter error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* -------------------- Start server -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
