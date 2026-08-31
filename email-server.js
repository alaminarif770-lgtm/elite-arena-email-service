const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Queen SMTP Official API Configuration
const QUEEN_API_URL = "https://queensmtp.com/v1/send";
const QUEEN_API_KEY = process.env.QUEEN_SMTP_API_KEY || "sk_live_f9beHLYd0mmNYXfpbDCtP6KE2JfCtF5";
const DOMAIN = "elitearena.live";

// 🟢 হেলথ চেক রুট
app.get('/', (req, res) => {
  res.status(200).send("🚀 Elite Arena Enterprise Email Service Live & Active!");
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
    console.log("✅ Firebase Connected to Email Service");
  }
} catch (e) {
  console.error("Firebase Error:", e.message);
}

const db = admin.database();

// ==========================================
// ⚙️ ইনঅ্যাক্টিভ রিমাইন্ডার শিডিউল কনফিগারেশন
// ==========================================
const INACTIVE_CONFIG = {
  STAGE_1_DELAY: 24 * 60 * 60 * 1000,       // শেষ Active হওয়ার ২৪ ঘণ্টা পর
  STAGE_2_INTERVAL: 4 * 24 * 60 * 60 * 1000, // ১ম মেইলের ৪ দিন পর
  STAGE_3_INTERVAL: 7 * 24 * 60 * 60 * 1000, // ২য় মেইলের ৭ দিন পর
  STAGE_4_INTERVAL: 14 * 24 * 60 * 60 * 1000,// ৩য় মেইলের ১৪ দিন পর
  STAGE_5_INTERVAL: 30 * 24 * 60 * 60 * 1000,// ৪র্থ মেইলের ৩০ দিন পর
  RECURRING_INTERVAL: 30 * 24 * 60 * 60 * 1000 // এরপর প্রতি ৩০ দিন পরপর সর্বোচ্চ ১টি
};

// ==========================================
// ⚡ Queen SMTP দিয়ে মেইল পাঠানোর মূল ফাংশন
// ==========================================
async function sendQueenEmail({ fromEmail, fromName, to, subject, html, text }) {
  const response = await fetch(QUEEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QUEEN_API_KEY}`
    },
    body: JSON.stringify({
      from: fromEmail,
      fromName: fromName || "ELITE ARENA BD",
      replyTo: "support@elitearena.live",
      to: to.trim(),
      subject: subject,
      html: html,
      text: text || "ELITE ARENA BD - Official Notification"
    })
  });
  return await response.json();
}

// ⏰ সময় ফরম্যাট ফাংশন
function getFormattedBSTTime() {
  const now = new Date();
  return now.toLocaleString('bn-BD', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// ==========================================
// 🎨 ১. নতুন ইউজার ওয়েলকাম ইমেইল টেমপ্লেট
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
// 🎨 ২. উইথড্র ও পেমেন্ট স্ট্যাটাস টেমপ্লেট
// ==========================================
function getWithdrawStatusEmailTemplate(data) {
  const name = data.name || 'Player';
  const amount = data.amount || 0;
  const method = data.method || 'Bkash';
  const number = data.number || 'N/A';
  const date = data.date || getFormattedBSTTime();
  const isApproved = data.status === 'approved' || data.status === 'completed';

  const badgeStyle = isApproved 
    ? 'background-color: #DCFCE7; border: 1px solid #BBF7D0; color: #15803D;' 
    : 'background-color: #FEE2E2; border: 1px solid #FECDD3; color: #B91C1C;';

  const badgeText = isApproved ? '● PAYMENT COMPLETED' : '● WITHDRAWAL REJECTED';
  const headline = isApproved ? 'উইথড্র রিকোয়েস্ট সফল হয়েছে!' : 'উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে!';
  const messageBody = isApproved 
    ? `প্রিয় <strong>${name}</strong>, আপনার উইথড্র রিকোয়েস্টটি যাচাই করে সফলভাবে পরিশোধ করা হয়েছে।`
    : `প্রিয় <strong>${name}</strong>, আপনার উইথড্র রিকোয়েস্টটি এডমিন দ্বারা বাতিল করা হয়েছে।`;

  const amountLabel = isApproved ? 'পরিশোধিত ব্যালেন্স' : 'অনুরোধকৃত ব্যালেন্স';

  const reasonBoxHtml = !isApproved ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF5F5; border-left: 4px solid #E50914; border-radius: 4px 10px 10px 4px; padding: 12px 14px; text-align: left; margin-bottom: 20px;">
      <tr>
        <td style="font-size: 13px; color: #991B1B; line-height: 1.5;">
          <strong>❌ বাতিলের কারণ:</strong> ${data.reason || 'এডমিন দ্বারা বাতিল করা হয়েছে'}<br>
          <span style="font-size: 12px; color: #6B7280; margin-top: 4px; display: inline-block;">আপনার কাটা টাকা উইনিং ব্যালেন্সে ফেরত দেওয়া হয়েছে। সঠিক তথ্য দিয়ে পুনরায় উইথড্র দিন।</span>
        </td>
      </tr>
    </table>` : '';

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Withdrawal Status - ELITE ARENA BD</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F8F9FA; font-family: 'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA;">

  <div style="display: none; font-size: 1px; color: #F8F9FA; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    আপনার উইথড্র রিকোয়েস্টের আপডেট: ELITE ARENA BD
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 40px 14px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #EAEAEA; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04); overflow: hidden; text-align: center;">
          
          <tr>
            <td align="center" style="padding: 36px 30px 16px 30px;">
              <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="48" height="48" style="display: block; border-radius: 12px; margin-bottom: 12px;">
              <div style="font-size: 13px; font-weight: 800; color: #111827; letter-spacing: 2px; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif;">
                ELITE ARENA <span style="color: #E50914;">BD</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 32px 32px;">
              
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="${badgeStyle} border-radius: 50px; padding: 5px 16px;">
                    <span style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Plus Jakarta Sans', sans-serif;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; line-height: 1.35;">
                ${headline}
              </h1>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                ${messageBody}
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 14px; padding: 16px; margin-bottom: 22px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 11.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">${amountLabel}</div>
                    <div style="font-size: 32px; font-weight: 900; color: #111827; margin-top: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">৳${amount}</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 14px; margin-bottom: 20px; text-align: left; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #6B7280;">
                    পেমেন্ট মেথড: <strong style="color: #111827; float: right; text-transform: capitalize;">${method}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #6B7280;">
                    প্রাপক ওয়ালেট নম্বর: <strong style="color: #111827; float: right; font-family: 'Plus Jakarta Sans', sans-serif;">${number}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #6B7280;">
                    অনুরোধের সময়: <strong style="color: #111827; float: right;">${date}</strong>
                  </td>
                </tr>
              </table>

              ${reasonBoxHtml}

              <p style="font-size: 12.5px; color: #9CA3AF; line-height: 1.6; margin: 0;">
                অনুগ্রহ করে আপনার ওয়ালেট ব্যালেন্স চেক করুন। যেকোনো সমস্যায় অ্যাপের হেল্পলাইনে যোগাযোগ করতে পারেন।
              </p>

            </td>
          </tr>

          <tr>
            <td style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 18px 24px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 11.5px; margin: 0 0 3px 0;">
                © 2026 ELITE ARENA BD • Transaction Notification
              </p>
              <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
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
// 🎨 ৩. পবিত্র শুক্রবারের স্পেশাল ডিপোজিট বোনাস অফার টেমপ্লেট
// ==========================================
function getFridayOfferEmailTemplate(userName) {
  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body, table, td, a { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
    body { 
      margin: 0; 
      padding: 0; 
      width: 100% !important; 
      background-color: #F1F5F9; 
      font-family: 'Hind Siliguri', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9;">

  <div style="display: none; font-size: 1px; color: #F1F5F9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস অফার! আজ সকাল ৯:০০ টা থেকে রাত ১২:০০ টা পর্যন্ত অফারটি চলবে।
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 35px 12px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #CBD5E1; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06); overflow: hidden;">
          
          <tr>
            <td align="center" style="padding: 30px 20px 14px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px auto;">
                <tr>
                  <td style="padding: 5px; background: #FFF1F2; border-radius: 16px; border: 1px solid #FFE4E6;">
                    <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="48" height="48" style="display: block; border-radius: 12px;">
                  </td>
                </tr>
              </table>
              <div style="color: #0F172A; font-size: 15px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; font-family: 'Poppins', Arial, sans-serif;">
                ELITE ARENA <span style="color: #E50914;">BD</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px;">
              <div style="border-top: 1px solid #E2E8F0;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding: 22px 24px 30px 24px; text-align: center;">
              
              <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; line-height: 1.4; margin: 0 0 8px 0;">
                🎉✨ পবিত্র শুক্রবার স্পেশাল<br>
                <span style="color: #E50914;">ডিপোজিট বোনাস অফার</span> ✨🎉
              </h1>

              <p style="color: #1E293B; font-size: 14.5px; margin: 0 0 18px 0; font-weight: 600; line-height: 1.5;">
                নির্ধারিত প্যাকেজে ডিপোজিট করে উপভোগ করুন আকর্ষণীয় ক্যাশ বোনাস!
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 16px; padding: 6px 10px; margin-bottom: 20px;">
                
                <tr>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 99 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 110 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+11৳)</span>
                  </td>
                </tr>

                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 149 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 165 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+16৳)</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 249 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 280 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+31৳)</span>
                  </td>
                </tr>

                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 349 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 390 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+41৳)</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 499 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 560 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+61৳)</span>
                  </td>
                </tr>

                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 599 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 680 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+81৳)</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 699 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 790 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+91৳)</span>
                  </td>
                </tr>

                <tr style="background-color: #F8FAFC;">
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-size: 15px; color: #0F172A; font-weight: 700;">
                    💸 999 টাকা
                  </td>
                  <td style="padding: 9px 6px; border-bottom: 1px dashed #CBD5E1; text-align: center; color: #E50914; font-size: 15px; font-weight: 800;">➔</td>
                  <td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; font-size: 15px; font-weight: 800; color: #E50914;">
                    🎁 1120 টাকা <span style="font-size: 12px; color: #15803D; font-weight: 800; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #BBF7D0;">(+121৳)</span>
                  </td>
                </tr>

                <tr style="background-color: #FFF1F2; border-radius: 8px;">
                  <td style="padding: 11px 10px; text-align: left; font-size: 15.5px; font-weight: 900; color: #0F172A;">
                    🔥 1999 টাকা
                  </td>
                  <td style="padding: 11px 6px; text-align: center; color: #E50914; font-size: 15.5px; font-weight: 900;">➔</td>
                  <td style="padding: 11px 10px; text-align: right; font-size: 16px; font-weight: 900; color: #E50914;">
                    🎁 2250 টাকা <span style="font-size: 12.5px; color: #15803D; font-weight: 900; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; border: 1px solid #86EFAC;">(+251৳)</span>
                  </td>
                </tr>

              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF9F9; border: 1px solid #FECDD3; border-left: 5px solid #E50914; border-radius: 8px; padding: 14px 16px; text-align: left; margin-bottom: 8px;">
                <tr>
                  <td style="font-size: 14px; color: #0F172A; line-height: 1.7;">
                    <div style="margin-bottom: 8px; font-weight: 600;">
                      ⏰ <strong>অফারের সময়সীমা:</strong><br>
                      অফারটি চলবে আজ <strong style="color: #E50914;">সকাল ৯:০০ টা থেকে রাত ১২:০০ টা পর্যন্ত</strong>।
                    </div>
                    <div style="color: #991B1B; background: #FEE2E2; border: 1px solid #FECDD3; padding: 10px 12px; border-radius: 6px; font-size: 13.5px; font-weight: 700; line-height: 1.5;">
                      ⚠️ বিশেষ নিয়ম / সতর্কতা:<br>
                      অ্যাড মানি (Add Money) করার সময় তালিকায় থাকা নির্দিষ্ট পরিমাণ টাকাই ডিপোজিট করতে হবে। ১ টাকা কম বা বেশি করলে বোনাস অ্যাড হবে না।
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 16px 25px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="color: #475569; font-size: 12.5px; font-weight: 600; margin: 0;">
                © 2026 ELITE ARENA BD • <a href="https://elitearena.live" target="_blank" style="color: #E50914; text-decoration: none; font-weight: 700;">elitearena.live</a>
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
// 🎨 ৪. ইনঅ্যাক্টিভ প্লেয়ার টুর্নামেন্ট রিমাইন্ডার টেমপ্লেট
// ==========================================
function getInactiveReminderTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELITE ARENA BD</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden;">
          <tr>
            <td align="center" style="padding: 40px 30px 20px 30px;">
              <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="56" height="56" style="display: block; border-radius: 12px; border: 1px solid #f1f5f9; margin: 0 auto;">
              <h3 style="margin: 12px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; text-align: center;">
                ELITE ARENA BD
              </h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 35px 35px 35px; text-align: center;">
              <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; line-height: 1.5; margin: 0 0 14px 0;">
                আপনাকে মিস করছে টুর্নামেন্ট,<br>
                <span style="color: #e63946; display: inline-block; white-space: nowrap; font-weight: 800;">${name}</span>
              </h1>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                গত কয়েকদিন ধরে আপনাকে অ্যাপে সক্রিয় পাওয়া যাচ্ছে না। আপনার প্রিয় কাস্টম রুম ও টুর্নামেন্টগুলো কিন্তু নিয়মিত চলছে। এখনই অ্যাপ ডাউনলোড করুন এবং আপনার স্কিল দিয়ে প্রাইজমানি জিতে নিন।
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff5f5; border: 1px solid #ffe3e3; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: left;">
                    <div style="color: #e63946; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                      Today's Live Status
                    </div>
                    <div style="color: #1e293b; font-size: 14px; font-weight: 500; line-height: 1.5;">
                      কাস্টম ম্যাচ স্লট ওপেন আছে এবং বিকাশ/নগদে ইনস্ট্যান্ট উইথড্র সুবিধা সক্রিয় রয়েছে।
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #e63946; border-radius: 8px;">
                    <a href="https://elitearena.live" 
                       target="_blank" 
                       style="display: inline-block; padding: 14px 36px; font-size: 15px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 0.5px; border-radius: 8px;">
                      অ্যাপে প্রবেশ করুন (APK)
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 30px; background-color: #fcfdfe; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 500;">
                © 2026 ELITE ARENA BD. All rights reserved.
              </p>
              <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                আপনার রেজিস্টার্ড অ্যাকাউন্টের তথ্যের ভিত্তিতে এই নোটিফিকেশনটি পাঠানো হয়েছে।
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
// 🎨 ৫. পাসওয়ার্ড ওটিপি টেমপ্লেট
// ==========================================
function getOtpEmailTemplate(userName, otpCode) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELITE ARENA BD - OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden; text-align: center;">
        <tr><td style="padding: 40px 30px 20px 30px;">
          <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="56" height="56" style="display: block; margin: 0 auto; border-radius: 12px;">
          <h3 style="margin: 12px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">ELITE ARENA BD</h3>
        </td></tr>
        <tr><td style="padding: 10px 35px 35px 35px;">
          <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.4; margin: 0 0 14px 0;">
            পাসওয়ার্ড রিকভারি কোড,<br><span style="color: #e63946;">${name}</span>
          </h1>
          <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
            আপনার <strong>ELITE ARENA BD</strong> অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য নিচে ৬ ডিজিটের ওটিপি কোডটি প্রদান করা হলো। এটি কারো সাথে শেয়ার করবেন না।
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff5f5; border: 1px solid #ffe3e3; border-radius: 12px; margin-bottom: 24px;">
            <tr><td align="center" style="padding: 20px; font-size: 32px; font-weight: 800; color: #e63946; letter-spacing: 8px; font-family: monospace;">
              ${otpCode}
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 12px; margin-bottom: 10px;">
            <tr><td style="padding: 14px 18px; text-align: left;">
              <div style="color: #64748b; font-size: 13px; font-weight: 500; line-height: 1.5;">
                ⚠️ এই ওটিপি কোডটির মেয়াদ আগামী <strong>৫ মিনিট</strong>। আপনি পাসওয়ার্ড রিকভারি রিকোয়েস্ট না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।
              </div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding: 24px 30px; background-color: #fcfdfe; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 500;">© 2026 ELITE ARENA BD. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ==========================================
// 🔍 ১-ক্লিক টেস্ট রাউট (সবগুলো ইমেইল আলাদা টেস্ট)
// ==========================================
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';
  const type = req.query.type || 'welcome'; // welcome, otp, withdraw, reject, offer, reminder

  try {
    let fromEmail = `welcome@${DOMAIN}`;
    let fromName = "ELITE ARENA Official";
    let subject = 'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে';
    let plainText = 'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।';
    let html = getWelcomeEmailTemplate({ name: 'Alamin Arif', supportPin: '7842', email: targetEmail });

    if (type === 'otp') {
      fromEmail = `security@${DOMAIN}`;
      fromName = "ELITE ARENA Security";
      subject = 'পাসওয়ার্ড রিকভারি ওটিপি কোড (OTP)';
      plainText = 'আপনার পাসওয়ার্ড রিকভারি ওটিপি কোড: 489210';
      html = getOtpEmailTemplate('Alamin Arif', '489210');
    } else if (type === 'withdraw') {
      fromEmail = `payment@${DOMAIN}`;
      fromName = "ELITE ARENA Payment";
      subject = 'উইথড্র রিকোয়েস্ট সফল হয়েছে! - ELITE ARENA BD';
      plainText = 'আপনার উইথড্র রিকোয়েস্টটি সফলভাবে পরিশোধ করা হয়েছে। পরিমাণ: ৳500';
      html = getWithdrawStatusEmailTemplate({
        name: 'Alamin Arif',
        amount: 500,
        method: 'Bkash',
        number: '01700000000',
        date: getFormattedBSTTime(),
        status: 'approved'
      });
    } else if (type === 'reject') {
      fromEmail = `payment@${DOMAIN}`;
      fromName = "ELITE ARENA Payment";
      subject = 'উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে - ELITE ARENA BD';
      plainText = 'আপনার উইথড্র রিকোয়েস্টটি বাতিল করা হয়েছে।';
      html = getWithdrawStatusEmailTemplate({
        name: 'Alamin Arif',
        amount: 500,
        method: 'Bkash',
        number: '01700000000',
        date: getFormattedBSTTime(),
        status: 'rejected',
        reason: 'আজকের বিকাশ লিমিট শেষ হওয়ায় বাতিল করা হয়েছে।'
      });
    } else if (type === 'offer') {
      fromEmail = `offers@${DOMAIN}`;
      fromName = "ELITE ARENA Offers";
      subject = 'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস! - ELITE ARENA BD';
      plainText = 'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস অফার! আজই ডিপোজিট করুন।';
      html = getFridayOfferEmailTemplate('Alamin Arif');
    } else if (type === 'reminder') {
      fromEmail = `noreply@${DOMAIN}`;
      fromName = "ELITE ARENA BD";
      subject = 'আপনাকে মিস করছে টুর্নামেন্ট, Alamin Arif!';
      plainText = 'আপনাকে মিস করছে টুর্নামেন্ট! এখনই অ্যাপে ঢুকুন।';
      html = getInactiveReminderTemplate('Alamin Arif');
    }

    const result = await sendQueenEmail({ fromEmail, fromName, to: targetEmail, subject, html, text: plainText });

    return res.json({
      success: true,
      fromUsed: `${fromName} <${fromEmail}>`,
      targetEmail: targetEmail,
      type: type,
      queenResponse: result
    });
  } catch (err) {
    console.error("Test Email Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🔒 ওটিপি পাঠানোর অভ্যন্তরীণ API (মেইন সার্ভার থেকে কল করা হয়)
// ==========================================
app.post('/api/send-otp-internal', async (req, res) => {
  try {
    const { email, name, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const result = await sendQueenEmail({
      fromEmail: `security@${DOMAIN}`,
      fromName: "ELITE ARENA Security",
      to: email,
      subject: 'পাসওয়ার্ড রিকভারি ওটিপি কোড (OTP)',
      html: getOtpEmailTemplate(name || 'Player', otp),
      text: `আপনার পাসওয়ার্ড রিকভারি ওটিপি কোড: ${otp}`
    });

    return res.json({ success: true, response: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 💸 উইথড্র ও পেমেন্ট রসিদ পাঠানোর API
// ==========================================
app.post('/api/send-withdraw-email', async (req, res) => {
  try {
    const { email, name, amount, method, number, status, reason, date } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Email required' });

    const isApproved = status === 'approved' || status === 'completed';
    const subject = isApproved 
      ? 'উইথড্র রিকোয়েস্ট সফল হয়েছে! - ELITE ARENA BD' 
      : 'উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে - ELITE ARENA BD';

    const result = await sendQueenEmail({
      fromEmail: `payment@${DOMAIN}`,
      fromName: "ELITE ARENA Payment",
      to: email,
      subject: subject,
      html: getWithdrawStatusEmailTemplate({
        name: name || 'Player',
        amount: amount,
        method: method || 'Bkash',
        number: number || 'N/A',
        date: date || getFormattedBSTTime(),
        status: status,
        reason: reason
      }),
      text: isApproved ? `আপনার উইথড্র সফল হয়েছে! ৳${amount}` : `উইথড্র বাতিল: ${reason}`
    });

    return res.json({ success: true, response: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🤖 ১. স্বয়ংক্রিয় রিয়েলটাইম ওয়েলকাম ইমেইল লিসেনার
// ==========================================
db.ref('users').on('child_added', async (snapshot) => {
  try {
    const uid = snapshot.key;
    const user = snapshot.val();

    if (!user || !user.email || !user.email.includes('@')) return;

    const welcomeLogSnap = await db.ref(`welcome_email_logs/${uid}`).once('value');
    if (!welcomeLogSnap.exists()) {
      const now = Date.now();
      const joinedTime = user.joinedAt ? new Date(user.joinedAt).getTime() : now;

      // শুধুমাত্র গত ২ ঘণ্টার মধ্যে জয়েন করা নতুন ইউজারকে পাঠাবে
      if ((now - joinedTime) < 2 * 60 * 60 * 1000) {
        await sendQueenEmail({
          fromEmail: `welcome@${DOMAIN}`,
          fromName: "ELITE ARENA Official",
          to: user.email,
          subject: 'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে',
          html: getWelcomeEmailTemplate({
            name: user.name || 'Player',
            supportPin: user.supportPin || 'N/A',
            email: user.email
          }),
          text: `স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে। সাপোর্ট পিন: #${user.supportPin || 'N/A'}`
        });

        await db.ref(`welcome_email_logs/${uid}`).set({ sentAt: now });
        console.log(`✅ [Auto-Welcome Sent] ${user.email}`);
      }
    }
  } catch (err) {
    console.error("Auto Welcome Listener Error:", err.message);
  }
});

// ==========================================
// 🚀 ২. সবার জন্য অফার ব্রডকাস্ট API (অ্যাডমিন কন্ট্রোলড)
// ==========================================
app.post('/api/broadcast-offer', async (req, res) => {
  try {
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) {
      return res.status(400).json({ success: false, message: 'কোনো ইউজার পাওয়া যায়নি।' });
    }

    const users = usersSnap.val();
    const queue = [];

    for (const uid in users) {
      const u = users[uid];
      if (u.email && u.email.includes('@') && u.isBanned !== true) {
        queue.push({ uid, email: u.email.trim(), name: u.name || 'Player' });
      }
    }

    // ব্যাকগ্রাউন্ডে ব্রডকাস্ট শুরু
    startCampaignBroadcast(
      queue, 
      `offers@${DOMAIN}`,
      "ELITE ARENA Offers",
      'Friday Offer', 
      getFridayOfferEmailTemplate, 
      'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস! - ELITE ARENA BD',
      'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস অফার! আজই ডিপোজিট করুন এবং বোনাস উপভোগ করুন।'
    );

    return res.json({
      success: true,
      message: `অফার ব্রডকাস্ট শুরু হয়েছে (মোট ${queue.length} জন ইউজার)।`,
      total: queue.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🎮 ৩. ইনঅ্যাক্টিভ প্লেয়ার রিমাইন্ডার ইঞ্জিন (স্বয়ংক্রিয় ও ম্যানুয়াল দুটোই)
// ==========================================
async function runInactiveReminderEngine() {
  console.log("⏰ Inactive Reminder Engine Running...");
  try {
    const now = Date.now();
    const [usersSnap, trackingSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('inactive_reminder_tracking').once('value')
    ]);

    if (!usersSnap.exists()) return;

    const users = usersSnap.val() || {};
    const trackingData = trackingSnap.val() || {};
    let sentCount = 0;

    for (const uid in users) {
      const user = users[uid];
      if (!user.email || !user.email.includes('@') || user.isBanned === true) continue;

      // 🛑 যারা নতুন অ্যাপ এখনও একবারও খোলেনি (last_active নেই) তাদের বাদ রাখা
      if (!user.last_active) continue;

      const lastActive = user.last_active;
      let userTrack = trackingData[uid] || {
        uid: uid,
        email: user.email,
        name: user.name || "Player",
        last_active: lastActive,
        current_stage: 0,
        status: "active_reset",
        last_reminder_sent_at: null,
        next_reminder_due_at: lastActive + INACTIVE_CONFIG.STAGE_1_DELAY,
        sent_stages: {}
      };

      if (lastActive > (userTrack.last_active || 0)) {
        userTrack = {
          uid: uid,
          email: user.email,
          name: user.name || "Player",
          last_active: lastActive,
          current_stage: 0,
          status: "active_reset",
          last_reminder_sent_at: null,
          next_reminder_due_at: lastActive + INACTIVE_CONFIG.STAGE_1_DELAY,
          sent_stages: {}
        };
        await db.ref(`inactive_reminder_tracking/${uid}`).set(userTrack);
      }

      const currentStage = userTrack.current_stage || 0;
      let shouldSend = false;
      let targetStageToSend = 0;
      let nextDueTime = 0;

      // ১. প্রথম Email: শেষ Active হওয়ার ২৪ ঘণ্টা পর
      if (currentStage === 0 && (now - lastActive) >= INACTIVE_CONFIG.STAGE_1_DELAY) {
        shouldSend = true;
        targetStageToSend = 1;
        nextDueTime = now + INACTIVE_CONFIG.STAGE_2_INTERVAL;
      }
      // ২. দ্বিতীয় Email: ১ম মেইলের ৪ দিন পর
      else if (currentStage === 1 && now >= (userTrack.next_reminder_due_at || 0)) {
        shouldSend = true;
        targetStageToSend = 2;
        nextDueTime = now + INACTIVE_CONFIG.STAGE_3_INTERVAL;
      }
      // ৩. তৃতীয় Email: ২য় মেইলের ৭ দিন পর
      else if (currentStage === 2 && now >= (userTrack.next_reminder_due_at || 0)) {
        shouldSend = true;
        targetStageToSend = 3;
        nextDueTime = now + INACTIVE_CONFIG.STAGE_4_INTERVAL;
      }
      // ৪. চতুর্থ Email: ৩য় মেইলের ১৪ দিন পর
      else if (currentStage === 3 && now >= (userTrack.next_reminder_due_at || 0)) {
        shouldSend = true;
        targetStageToSend = 4;
        nextDueTime = now + INACTIVE_CONFIG.STAGE_5_INTERVAL;
      }
      // ৫. পঞ্চম Email: ৪র্থ মেইলের ৩০ দিন পর
      else if (currentStage === 4 && now >= (userTrack.next_reminder_due_at || 0)) {
        shouldSend = true;
        targetStageToSend = 5;
        nextDueTime = now + INACTIVE_CONFIG.RECURRING_INTERVAL;
      }
      // ৬. এরপর প্রতি ৩০ দিন পরপর সর্বোচ্চ ১টি
      else if (currentStage >= 5 && now >= (userTrack.next_reminder_due_at || 0)) {
        shouldSend = true;
        targetStageToSend = 5;
        nextDueTime = now + INACTIVE_CONFIG.RECURRING_INTERVAL;
      }

      if (shouldSend) {
        try {
          await sendQueenEmail({
            fromEmail: `noreply@${DOMAIN}`,
            fromName: "ELITE ARENA BD",
            to: user.email,
            subject: `আপনাকে মিস করছে টুর্নামেন্ট, ${user.name || 'Player'}!`,
            html: getInactiveReminderTemplate(user.name),
            text: `আপনাকে মিস করছে টুর্নামেন্ট! কাস্টম ম্যাচ স্লট ওপেন আছে। এখনই অ্যাপে প্রবেশ করে খেলুন।`
          });

          const updatedTrack = {
            ...userTrack,
            current_stage: targetStageToSend,
            last_reminder_sent_at: now,
            next_reminder_due_at: nextDueTime,
            status: "in_sequence"
          };
          if (!updatedTrack.sent_stages) updatedTrack.sent_stages = {};
          updatedTrack.sent_stages[`stage_${targetStageToSend}`] = now;

          await db.ref(`inactive_reminder_tracking/${uid}`).update(updatedTrack);
          sentCount++;
          console.log(`✅ [Inactive Reminder Sent] ${user.email}`);

          await new Promise(r => setTimeout(r, 200));
        } catch (mailErr) {
          console.error(`❌ Inactive Mail Failed (${user.email}):`, mailErr.message);
        }
      }
    }
    return sentCount;
  } catch (err) {
    console.error("Inactive Reminder Engine Error:", err);
  }
}

// ⏰ প্রতি ১ ঘণ্টা পরপর স্বয়ংক্রিয় ব্যাকগ্রাউন্ড চেক
cron.schedule('0 * * * *', runInactiveReminderEngine);

// 🕹️ অ্যাডমিন ম্যানুয়ালি যেকোনো সময় রিমাইন্ডার পাঠানোর API
app.post('/api/send-inactive-reminders', async (req, res) => {
  try {
    const totalSent = await runInactiveReminderEngine();
    return res.json({ success: true, message: `ইনঅ্যাক্টিভ রিমাইন্ডার সম্পন্ন হয়েছে! মোট ${totalSent || 0} টি মেইল পাঠানো হয়েছে।` });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ==========================================
// ⚙️ ব্যাকগ্রাউন্ড ব্রডকাস্ট ইঞ্জিন (Queen SMTP)
// ==========================================
async function startCampaignBroadcast(queue, fromEmail, fromName, campaignName, templateFunc, subject, plainText) {
  const total = queue.length;
  let successCount = 0;
  let failCount = 0;
  const statusRef = db.ref('email_campaign_status');
  const logsRef = db.ref('campaign_live_logs');

  await logsRef.remove();
  await statusRef.set({
    isRunning: true,
    campaignName: campaignName,
    total: total,
    processed: 0,
    success: 0,
    failed: 0,
    percentage: 0,
    statusText: `${campaignName} শুরু হচ্ছে...`,
    startTime: Date.now(),
    lastUpdated: Date.now()
  });

  for (let i = 0; i < total; i++) {
    const item = queue[i];
    let isSuccess = false;
    let failReason = null;

    try {
      await sendQueenEmail({
        fromEmail: fromEmail,
        fromName: fromName,
        to: item.email,
        subject: subject,
        html: templateFunc(item.name),
        text: plainText
      });
      isSuccess = true;
      successCount++;
    } catch (err) {
      isSuccess = false;
      failReason = err.message || 'Queen SMTP Error';
      failCount++;
    }

    const processed = i + 1;
    const percentage = Math.round((processed / total) * 100);
    const logTime = new Date().toLocaleTimeString('en-US', { hour12: true });

    await logsRef.push({
      message: isSuccess 
        ? `✅ [${logTime}] (${processed}/${total}) Sent: ${item.email}` 
        : `❌ [${logTime}] (${processed}/${total}) Failed: ${item.email} (${failReason})`,
      timestamp: Date.now()
    });

    await statusRef.update({
      processed: processed,
      success: successCount,
      failed: failCount,
      percentage: percentage,
      statusText: `[${processed}/${total}] ${isSuccess ? 'Sent' : 'Failed'}: ${item.email}`,
      lastUpdated: Date.now()
    });

    await new Promise(res => setTimeout(res, 200));
  }

  await statusRef.update({ isRunning: false, statusText: 'Completed', endTime: Date.now() });
}

// 🟢 ক্লাউড হোস্ট বাইন্ডিং
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Elite Arena Dedicated Email Service Running on Port ${PORT}`));
