require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const axios = require("axios");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post("/book", async (req, res) => {
    const { robloxUsername, discordUsername, seat, email, show, time, date } = req.body;

    try {
        // Save to Supabase
        await supabase.from("bookings").insert([{ robloxUsername, discordUsername, seat, email, show }]);

        // Send styled HTML email
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
        <tr>
          <td style="padding: 8px;"><strong>Show:</strong></td>
          <td style="padding: 8px;">${show}</td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>On:</strong></td>
          <td style="padding: 8px;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>At:</strong></td>
          <td style="padding: 8px;">${time}</td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>Seat:</strong></td>
          <td style="padding: 8px;">${seat}</td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>Roblox Username:</strong></td>
          <td style="padding: 8px;">${robloxUsername}</td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>Discord Username:</strong></td>
          <td style="padding: 8px;">${discordUsername}</td>
        </tr>
        <tr>
          <td style="padding: 8px;"><strong>Email:</strong></td>
          <td style="padding: 8px;">${email}</td>
        </tr>
      </table>
    </div>

    <hr style="border: none; border-top: 1px dashed #aaa;" />

    <div style="text-align: center; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px;">🎟 Please arrive 10 minutes early for check-in.</p>
      <p style="margin: 0; font-size: 14px;">Thank you for booking with us!</p>
    </div>
  </div>
`
        });

        // Send styled Discord webhook embed
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
                        { name: "Show", value: show, inline: false },
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
        console.error(err);
        res.status(500).json({ message: "Error processing booking." });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(4000, () => console.log("✅ Backend running on http://localhost:4000"));
