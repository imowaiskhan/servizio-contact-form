const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: ["https://servizioprimo.com", "https://www.servizioprimo.com"],
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get("/", (req, res) => {
  res.send("Contact backend is running");
});

app.post("/api/contact", async (req, res) => {
  try {
    const {
      fname,
      lname,
      email,
      company,
      revenue,
      channel,
      message = "",
    } = req.body;

    if (
      !fname?.trim() ||
      !lname?.trim() ||
      !email?.trim() ||
      !company?.trim() ||
      !revenue?.trim() ||
      !channel?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Servizio Primo Website" <${process.env.SMTP_FROM}>`,
      to: "hello@servizioprimo.com",
      replyTo: email,
      subject: `New Contact Form Submission - ${fname} ${lname}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Contact Form Submission</h2>
          <p><strong>First Name:</strong> ${fname}</p>
          <p><strong>Last Name:</strong> ${lname}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Revenue:</strong> ${revenue}</p>
          <p><strong>Channel:</strong> ${channel}</p>
          <p><strong>Message:</strong><br>${message || "N/A"}</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending email",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});