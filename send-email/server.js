
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// import express from "express";
// import cors from "cors";
const bodyParser = require("body-parser");
const { Resend } = require("resend");
const corsOptions = {
  origin: "http://localhost:5173/", // Update with your frontend URL
  methods: "POST",
  allowedHeaders: ["Content-Type"],
};
require('dotenv').config();
const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());


const resend = new Resend('re_f6g8gxzB_EAyrgZ8VJW2AAAxdmqqNohEH');

app.post("/send-email", async (req, res) => {
  const { reportType, reportDate, data } = req.body;
   
  try {
    const response = await resend.emails.send({
      from: "yourname@onresend.com", // Use a verified domain email
      to: "admin@gmail.com",
      subject: `Report: ${reportType} - ${reportDate}`,
      html: `
        <h2>${reportType === "preorders" ? "Completed Preorders" : "Leftover Stock"} Report</h2>
        <p>Date: ${reportDate}</p>
        <ul>
          ${data.map((item) => `<li>${JSON.stringify(item)}</li>`).join("")}
        </ul>
      `,
    });

    res.json({ success: true, message: "Email sent!", response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
