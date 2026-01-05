require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Gmail credentials from .env
const GMAIL_USER = process.env.GMAIL_USER; // ummehani.arts@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

app.post('/api/newsletter', async (req, res) => {
  const { subject, html, recipients } = req.body;

  if (!subject || !html || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'subject/html/recipients required' });
  }

  try {
    // Send emails in parallel but log success/failure per recipient
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

    // Separate success and failed emails
    const sent = results.filter(r => r.status === 'sent').map(r => r.email);
    const failed = results.filter(r => r.status === 'failed');

    console.log('Sent emails:', sent);
    if (failed.length > 0) console.error('Failed emails:', failed);

    return res.json({ ok: true, sent, failed });
  } catch (err) {
    console.error('Error sending emails:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
