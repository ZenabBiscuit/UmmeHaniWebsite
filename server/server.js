require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

/* -------------------- CORS -------------------- */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

/* -------------------- Body parser -------------------- */
app.use(express.json());

/* -------------------- Env vars -------------------- */
const GMAIL_USER = process.env.GMAIL_USER;              // ummehani.arts@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in Render env');
  process.exit(1);
}

/* -------------------- Nodemailer (Render-safe) -------------------- */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // required for 465
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

/* -------------------- Verify SMTP on boot -------------------- */
transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP connection failed:', err);
  } else {
    console.log('✅ Gmail SMTP is ready');
  }
});

/* -------------------- Health check -------------------- */
app.get('/', (_req, res) => {
  res.send('✅ Newsletter server is running');
});

/* -------------------- Newsletter API -------------------- */
app.post('/api/newsletter', async (req, res) => {
  const { subject, html, recipients } = req.body;

  if (!subject || !html || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'subject, html, recipients are required'
    });
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

    return res.json({ ok: true, sent, failed });

  } catch (err) {
    console.error('🔥 Newsletter fatal error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* -------------------- Start server -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
