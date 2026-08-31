const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const QUEEN_API_URL = "https://queensmtp.com/v1/send";
const QUEEN_API_KEY = process.env.QUEEN_SMTP_API_KEY || "sk_live_f9beHLYd0mmNYXfpbDCtP6KE2JfCtF5";

app.get('/', (req, res) => {
  res.send("🚀 Queen SMTP Email Service Live!");
});

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
        replyTo: "support@elitearena.live",
        to: targetEmail.trim(),
        subject: "স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে",
        html: `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAEAEA; overflow: hidden; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding: 36px 30px 20px 30px;">
              <div style="font-size: 16px; font-weight: 800; color: #111827; letter-spacing: 2px; text-transform: uppercase;">
                ELITE ARENA <span style="color: #E50914;">BD</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h1 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">
                স্বাগতম, <span style="color: #E50914;">Alamin Arif</span>!
              </h1>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। দেশের শীর্ষ এস্পোর্টস টুর্নামেন্টে অংশগ্রহণ করতে আপনি এখন সম্পূর্ণ প্রস্তুত।
              </p>
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAFA; border: 1px solid #F1F5F9; border-radius: 12px; margin-bottom: 24px; text-align: left;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #EDEDED; font-size: 13px; color: #6B7280;">
                    ইমেইল: <strong style="color: #111827; float: right;">${targetEmail}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #6B7280;">
                    সাপোর্ট পিন: <strong style="color: #E50914; float: right; font-weight: 800;">#7842</strong>
                  </td>
                </tr>
              </table>
              <table width="100%" cellspacing="0" cellpadding="0" style="text-align: left; font-size: 13px; color: #4B5563; line-height: 1.6;">
                <tr><td style="padding-bottom: 8px; color: #E50914; font-weight: bold; width: 20px;">✓</td><td style="padding-bottom: 8px;"><strong>স্লট বুক করুন:</strong> পছন্দের Solo বা Squad ম্যাচ বেছে নিন।</td></tr>
                <tr><td style="padding-bottom: 8px; color: #E50914; font-weight: bold; width: 20px;">✓</td><td style="padding-bottom: 8px;"><strong>রুম অ্যাক্সেস:</strong> ম্যাচ শুরুর আগে অ্যাপেই পাবেন আইডি ও পাসওয়ার্ড।</td></tr>
                <tr><td style="color: #E50914; font-weight: bold; width: 20px;">✓</td><td><strong>ইনস্ট্যান্ট ক্যাশআউট:</strong> সরাসরি বিকাশ ও নগদে প্রাইজমানি গ্রহণ করুন।</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 16px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 11.5px; margin: 0;">© 2026 ELITE ARENA BD • <a href="https://elitearena.live" target="_blank" style="color: #6B7280; text-decoration: none;">elitearena.live</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: "স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। সাপোর্ট পিন: #7842"
      })
    });

    const data = await response.json();
    return res.json({ success: true, data: data });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server on port ${PORT}`));
