require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const axios = require("axios");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// MongoDB Schema
const bookingSchema = new mongoose.Schema({
  robloxUsername: String,
  discordUsername: String,
  seat: String,
  email: String,
  show: String,
  date: String,
  time: String,
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model("Booking", bookingSchema);

// Booking Route
app.post("/book", async (req, res) => {
  const { robloxUsername, discordUsername, seat, email, show, date, time } = req.body;

  try {
    // Check if seat already booked
    const alreadyBooked = await Booking.findOne({ seat });
    if (alreadyBooked) {
      return res.status(400).json({ message: "Seat already booked." });
    }

    // Save to MongoDB
    const newBooking = new Booking({ robloxUsername, discordUsername, seat, email, show, date, time });
    await newBooking.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Theatre Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎭 Your Booking for ${show}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 2px dashed #555; padding: 20px; background-color: #fff; color: #222;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px; color: #c0392b;">🎭 THEATRE TICKET</h1>
            <p style="font-size: 16px; color: #555;">Admit One</p>
          </div>
          <hr style="border: none; border-top: 1px dashed #aaa;" />
          <div style="margin: 20px 0;">
            <table style="width: 100%; font-size: 16px;">
              <tr><td style="padding: 8px;"><strong>Show:</strong></td><td>${show}</td></tr>
              <tr><td style="padding: 8px;"><strong>Date:</strong></td><td>${date}</td></tr>
              <tr><td style="padding: 8px;"><strong>Time:</strong></td><td>${time}</td></tr>
              <tr><td style="padding: 8px;"><strong>Seat:</strong></td><td>${seat}</td></tr>
              <tr><td style="padding: 8px;"><strong>Roblox:</strong></td><td>${robloxUsername}</td></tr>
              <tr><td style="padding: 8px;"><strong>Discord:</strong></td><td>${discordUsername}</td></tr>
              <tr><td style="padding: 8px;"><strong>Email:</strong></td><td>${email}</td></tr>
            </table>
          </div>
          <hr style="border: none; border-top: 1px dashed #aaa;" />
          <div style="text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">🎟 Please arrive 10 minutes early.</p>
            <p style="margin: 0; font-size: 14px;">Thank you for booking with us!</p>
          </div>
        </div>`
    });

    // Discord Webhook
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      embeds: [
        {
          title: `🎟️ New Booking for ${show}`,
          color: 0x4caf50,
          fields: [
            { name: "Roblox Username", value: robloxUsername, inline: true },
            { name: "Discord Username", value: discordUsername, inline: true },
            { name: "Seat", value: seat, inline: true },
            { name: "Date", value: date, inline: true },
            { name: "Time", value: time, inline: true },
            { name: "Email", value: email, inline: false }
          ],
          footer: {
            text: "Theatre Booking System",
            icon_url: "https://cdn-icons-png.flaticon.com/512/942/942748.png"
          },
          timestamp: new Date().toISOString()
        }
      ]
    });

    res.json({ message: "Booking successful!" });

  } catch (err) {
    console.error("❌ Booking error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Get all booked seats
app.get("/booked-seats", async (req, res) => {
  try {
    const bookings = await Booking.find({}, "seat");
    const bookedSeats = bookings.map(b => b.seat);
    res.json({ bookedSeats });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booked seats." });
  }
});

// Serve the frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "public/six", "index.html"));
});

app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

app.listen(4000, () => console.log("✅ Server running on http://localhost:4000"));
