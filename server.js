const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
require("dotenv").config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// CORS Configuration
const allowedOrigins = [
  "https://servizioprimo.com",
  "https://www.servizioprimo.com",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Servizio Primo Contact API is running",
    timestamp: new Date().toISOString(),
  });
});

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Main contact endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const {
      fname = "",
      lname = "",
      email = "",
      company = "",
      revenue = "",
      channel = "",
      message = "",
    } = req.body || {};

    // Validate required fields
    if (!fname.trim() || !lname.trim() || !email.trim() || !company.trim() || !revenue.trim() || !channel.trim()) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Validate email format
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // Send email using Resend
    const data = await resend.emails.send({
      from: process.env.SMTP_FROM || "Servizio Primo <hello@servizioprimo.com>",
      to: process.env.SMTP_USER || "hello@servizioprimo.com",
      replyTo: email.trim(),
      subject: `New Contact Form - ${fname.trim()} ${lname.trim()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin-bottom: 15px;
                padding: 12px;
                background: white;
                border-radius: 6px;
                border-left: 4px solid #667eea;
              }
              .label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 4px;
              }
              .value {
                font-size: 16px;
                color: #333;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 New Contact Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Full Name</div>
                <div class="value">${fname.trim()} ${lname.trim()}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value">${email.trim()}</div>
              </div>
              <div class="field">
                <div class="label">Company</div>
                <div class="value">${company.trim()}</div>
              </div>
              <div class="field">
                <div class="label">Revenue</div>
                <div class="value">${revenue.trim()}</div>
              </div>
              <div class="field">
                <div class="label">Channel</div>
                <div class="value">${channel.trim()}</div>
              </div>
              ${message.trim() ? `
                <div class="field">
                  <div class="label">Message</div>
                  <div class="value">${message.trim()}</div>
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `,
    });

    console.log("✅ Email sent successfully:", data.id);

    return res.status(200).json({
      success: true,
      message: "Thank you! We'll be in touch soon.",
      data: { id: data.id },
    });

  } catch (error) {
    console.error("❌ CONTACT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Test endpoint
app.get("/api/test", async (req, res) => {
  try {
    const data = await resend.emails.send({
      from: process.env.SMTP_FROM || "Servizio Primo <hello@servizioprimo.com>",
      to: process.env.SMTP_USER || "hello@servizioprimo.com",
      subject: "✅ Resend Test - Servizio Primo",
      html: `
        <div style="padding: 20px; font-family: Arial;">
          <h1 style="color: #10b981;">✓ Test Successful!</h1>
          <p>Resend is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Test email sent",
      emailId: data.id,
    });
  } catch (error) {
    console.error("Test failed:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  if (err.message && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: "Server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✉️  Using Resend API`);
});