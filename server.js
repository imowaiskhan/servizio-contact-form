const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "https://servizioprimo.com",
  "https://www.servizioprimo.com",
  "http://localhost:3000", // optional for local testing
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin like Postman/server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get("/", (req, res) => {
  res.status(200).send("Contact backend is running");
});

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

    if (
      !fname.trim() ||
      !lname.trim() ||
      !email.trim() ||
      !company.trim() ||
      !revenue.trim() ||
      !channel.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: true,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"Servizio Primo Website" <${process.env.SMTP_FROM}>`,
      to: "hello@servizioprimo.com",
      replyTo: email.trim(),
      subject: `New Contact Form Submission - ${fname.trim()} ${lname.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Contact Form Submission</h2>
          <p><strong>First Name:</strong> ${fname.trim()}</p>
          <p><strong>Last Name:</strong> ${lname.trim()}</p>
          <p><strong>Email:</strong> ${email.trim()}</p>
          <p><strong>Company:</strong> ${company.trim()}</p>
          <p><strong>Revenue:</strong> ${revenue.trim()}</p>
          <p><strong>Channel:</strong> ${channel.trim()}</p>
          <p><strong>Message:</strong><br>${message.trim() || "N/A"}</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while sending email",
      error: error.message,
    });
  }
});

// Optional: handle CORS errors nicely
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});