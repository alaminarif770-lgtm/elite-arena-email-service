const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Queen SMTP Official API Configuration (From Documentation)
const QUEEN_API_URL = "https://queensmtp.com/v1/send";
const QUEEN_API_KEY = process.env.QUEEN_SMTP_API_KEY || "sk_live_f9beHLYd0mmNYXfpbDCtP6KE2JfCtF5";

// হেলথ চেক
app.get('/', (req, res) => {
  res.send("🚀 Queen SMTP Dedicated Test Server Active!");
});

// 🧪 ১-ক্লিক টেস্ট রুট
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';

  try {
    const response = await fetch(QUEEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${QUEEN_API_KEY}`
      },
      body: JSON.stringify({
        from: "welcome@elitearena.live",
        fromName: "ELITE ARENA Official",
        to: targetEmail.trim(),
        subject: "🎉 Queen SMTP Test Email - ELITE ARENA BD",
        html: `
          <div style="font-family: sans-serif; padding: 30px; text-align: center; border: 1px solid #EAEAEA; border-radius: 16px; max-width: 480px; margin: 0 auto;">
            <img src="https://elitearena.live/favicon.png" width="48" height="48" style="border-radius: 10px; margin-bottom: 12px;">
            <h2 style="color: #E50914; margin: 0 0 10px 0;">ELITE ARENA BD</h2>
            <h3 style="color: #111827;">অভিনন্দন! টেস্ট ইমেইল সফল হয়েছে!</h3>
            <p style="color: #6B7280; font-size: 14px;">Queen SMTP REST API সফলভাবে কানেক্ট হয়েছে এবং ১ সেকেন্ডেই ইনবক্সে মেইল পৌঁছে গেছে।</p>
            <div style="background: #FAFAFA; padding: 10px; border-radius: 8px; font-size: 13px; color: #333; margin-top: 15px;">
              প্রেরক: <b>welcome@elitearena.live</b>
            </div>
          </div>
        `,
        text: "অভিনন্দন! Queen SMTP API সফলভাবে কাজ করছে। প্রেরক: welcome@elitearena.live"
      })
    });

    const data = await response.json();
    return res.json({ success: true, data: data });

  } catch (err) {
    console.error("Test Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Test Server running on port ${PORT}`));
