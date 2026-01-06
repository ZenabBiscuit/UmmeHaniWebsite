require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 👈 allow base64 safely

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/api/newsletter', async (req, res) => {
  try {
    const { subject, html, recipients, attachment } = req.body;

    // 🔒 Validation
    if (
      !subject ||
      !html ||
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return res.status(400).json({
        error: 'subject, html, recipients are required'
      });
    }

    const to = recipients.slice(0, 1000).map(email => ({ email }));

    const payload = {
      sender: {
        name: 'UmmeHani',
        email: 'ummehani.arts@gmail.com'
      },
      replyTo: {
        name: 'UmmeHani',
        email: 'ummehani.arts@gmail.com'
      },
      to,
      subject,
      htmlContent: html
    };

    // 📎 OPTIONAL attachment
    if (attachment?.base64 && attachment?.name) {
      payload.attachment = [
        {
          name: attachment.name,
          content: attachment.base64.split(',')[1] // remove data:image/*
        }
      ];
    }

    const resp = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );

    return res.json({ ok: true, data: resp.data });

  } catch (err) {
    console.error('Brevo error:', err.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      error: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Newsletter server running on port ${PORT}`)
);
