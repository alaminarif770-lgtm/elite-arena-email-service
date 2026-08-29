const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 আপনার সফল ও পরীক্ষিত Welcome Google Webhook URL
const WELCOME_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyvhaE9rtQQR1y3ato8za2aW-lHhdQvR5vzUTlPSkE5RPshT_0vjPj2e2gY-YlQBPM/exec";

// 🟢 হেলথ চেক রুট
app.get('/', (req, res) => {
  res.status(200).send("🚀 Elite Arena Welcome Email Service Active & Live!");
});

// ১. ফায়ারবেস সার্ভিস ইনিশিয়ালাইজেশন
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://lonewolfbd-6450b-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
    console.log("✅ Firebase Connected to Welcome Email Service");
  }
} catch (e) {
  console.error("Firebase Error:", e.message);
}

const db = admin.database();

// ==========================================
// ⚡ গুগল রিলে দিয়ে সরাসরি Welcome মেইল পাঠানোর ফাংশন
// ==========================================
async function sendWelcomeMail(to, subject, htmlContent, plainText = "") {
  const response = await fetch(WELCOME_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      to: to.trim(),
      subject: subject,
      html: htmlContent,
      text: plainText || "ELITE ARENA BD - Welcome to our esports platform!",
      name: "ELITE ARENA BD"
    })
  });
  return await response.json();
}

// ==========================================
// 🎨 নতুন ইউজার ওয়েলকাম ইমেইল টেমপ্লেট (আপনার ফাইনাল মিনিমাল ডিজাইন)
// ==========================================
function getWelcomeEmailTemplate(data) {
  const name = data.name || 'Player';
  const supportPin = data.supportPin || 'N/A';
  const email = data.email || '';

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ELITE ARENA BD</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F8F9FA; font-family: 'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA;">

  <div style="display: none; font-size: 1px; color: #F8F9FA; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ELITE ARENA BD-তে স্বাগতম। আপনার অ্যাকাউন্ট সম্পূর্ণ তৈরি।
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 48px 16px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAEAEA; overflow: hidden; text-align: center;">
          
          <tr>
            <td align="center" style="padding: 40px 32px 20px 32px;">
              <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="48" height="48" style="display: block; border-radius: 10px; margin-bottom: 16px;">
              <div style="font-size: 13px; font-weight: 800; color: #111827; letter-spacing: 2px; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif;">
                ELITE ARENA <span style="color: #E50914;">BD</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 36px 36px 36px;">
              
              <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.35;">
                স্বাগতম, <span style="color: #E50914;">${name}</span>!
              </h1>
              
              <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। দেশের শীর্ষ টুর্নামেন্টগুলোতে অংশগ্রহণ করতে আপনি এখন সম্পূর্ণ প্রস্তুত।
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAFA; border: 1px solid #F1F5F9; border-radius: 12px; margin-bottom: 26px; text-align: left;">
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #EDEDED; font-size: 13.5px;">
                    <span style="color: #6B7280;">ইমেইল:</span>
                    <strong style="color: #111827; float: right; font-weight: 600;">${email}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; font-size: 13.5px;">
                    <span style="color: #6B7280;">সাপোর্ট পিন:</span>
                    <strong style="color: #E50914; float: right; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; letter-spacing: 0.5px;">#${supportPin}</strong>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="text-align: left; font-size: 13.5px; color: #4B5563; line-height: 1.5;">
                <tr>
                  <td style="padding-bottom: 12px; vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td>
                  <td style="padding-bottom: 12px;"><strong>স্লট বুক করুন:</strong> পছন্দের Solo বা Squad ম্যাচ বেছে নিন।</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td>
                  <td style="padding-bottom: 12px;"><strong>রুম অ্যাক্সেস:</strong> ম্যাচ শুরুর আগে অ্যাপেই পাবেন আইডি ও পাসওয়ার্ড।</td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td>
                  <td><strong>ইনস্ট্যান্ট ক্যাশআউট:</strong> সরাসরি বিকাশ ও নগদে প্রাইজমানি গ্রহণ করুন।</td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 20px 24px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px 0;">
                © 2026 ELITE ARENA BD. All rights reserved.
              </p>
              <p style="color: #9CA3AF; font-size: 11.5px; margin: 0;">
                <a href="https://elitearena.live" target="_blank" style="color: #6B7280; text-decoration: none;">elitearena.live</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

// ==========================================
// 🔍 ১-ক্লিক টেস্ট রাউট (Direct Browser Test)
// ==========================================
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';
  try {
    const result = await sendWelcomeMail(
      targetEmail,
      'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে',
      getWelcomeEmailTemplate({
        name: 'Alamin Arif',
        supportPin: '7842',
        email: targetEmail
      }),
      'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। আপনার সাপোর্ট পিন: #7842'
    );

    return res.json({ 
      success: true, 
      message: `Welcome টেস্ট মেইল সফলভাবে পাঠানো হয়েছে ${targetEmail} ঠিকানায়!`,
      googleResponse: result 
    });
  } catch (err) {
    console.error("Test Email Error:", err);
    return res.status(500).json({ success: false, message: 'ইমেইল পাঠাতে ব্যর্থ!', error: err.message });
  }
});

// ==========================================
// 🤖 স্বয়ংক্রিয় রিয়েলটাইম ওয়েলকাম ইমেইল লিসেনার
// ==========================================
db.ref('users').on('child_added', async (snapshot) => {
  try {
    const uid = snapshot.key;
    const user = snapshot.val();

    if (!user || !user.email || !user.email.includes('@')) return;

    // চেক করা ওয়েলকাম মেইল আগে পাঠানো হয়েছে কি না
    const welcomeLogSnap = await db.ref(`welcome_email_logs/${uid}`).once('value');
    if (!welcomeLogSnap.exists()) {
      const now = Date.now();
      const joinedTime = user.joinedAt ? new Date(user.joinedAt).getTime() : now;

      // শুধুমাত্র সাম্প্রতিক নতুন ইউজারকে পাঠাবে
      if ((now - joinedTime) < 2 * 60 * 60 * 1000) {
        await sendWelcomeMail(
          user.email,
          'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে',
          getWelcomeEmailTemplate({
            name: user.name || 'Player',
            supportPin: user.supportPin || 'N/A',
            email: user.email
          }),
          `স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে। আপনার সাপোর্ট পিন: #${user.supportPin || 'N/A'}`
        );

        await db.ref(`welcome_email_logs/${uid}`).set({ sentAt: now });
        console.log(`✅ [Auto-Welcome Sent] ${user.email}`);
      }
    }
  } catch (err) {
    console.error("Auto Welcome Listener Error:", err.message);
  }
});

// 🟢 ক্লাউড হোস্ট বাইন্ডিং
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Elite Arena Welcome Service Running on Port ${PORT}`));
