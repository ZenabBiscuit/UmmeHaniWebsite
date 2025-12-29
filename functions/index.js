// functions/index.js
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const BREVO_API_KEY = functions.config().brevo.key;

app.post('/newsletter', async (req, res) => {
  const { subject, html, recipients } = req.body;
  if (!subject || !html || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'subject/html/recipients required' });
  }

  const to = recipients.map(email => ({ email }));

  const payload = {
    sender: { name: 'UmmeHani', email: 'ummehani.tin@gmail.com' }, // verified sender
    to,
    subject,
    htmlContent: html
  };

  try {
    const resp = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      }
    });
    return res.json({ ok: true, data: resp.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ ok: false, error: err.response?.data || err.message });
  }
});

exports.api = functions.https.onRequest(app);

