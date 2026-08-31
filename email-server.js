const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Queen SMTP Official REST API Endpoint
const QUEEN_SMTP_API_URL = "https://api.queensmtp.com/v1/messages";
const QUEEN_SMTP_API_KEY = process.env.QUEEN_SMTP_API_KEY || "sk_live_f9beHLYd0mmNYXfpbDCtP6KE2JfCtF5";
const DOMAIN = "elitearena.live";

// 🟢 হেলথ চেক রুট
app.get('/', (req, res) => {
  res.status(200).send("🚀 Elite Arena Enterprise Email Microservice (Queen SMTP) Active & Live!");
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
// ⚡ Queen SMTP REST API দিয়ে মেইল পাঠানোর মূল ফাংশন
// ==========================================
async function sendQueenEmail({ from, to, subject, html, text }) {
  const recipients = Array.isArray(to) ? to : [to.trim()];

  const response = await fetch(QUEEN_SMTP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QUEEN_SMTP_API_KEY}`
    },
    body: JSON.stringify({
      from: from,
      to: recipients,
      subject: subject,
      html: html,
      text: text || "ELITE ARENA BD - Official Esports Notification"
    })
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || responseData.error || `HTTP Error ${response.status}`);
  }
  return responseData;
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
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAEAEA; overflow: hidden; text-align: center;">
        <tr><td align="center" style="padding: 40px 32px 20px 32px;">
          <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="48" height="48" style="display: block; border-radius: 10px; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 800; color: #111827; letter-spacing: 2px; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif;">
            ELITE ARENA <span style="color: #E50914;">BD</span>
          </div>
        </td></tr>
        <tr><td style="padding: 0 36px 36px 36px;">
          <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.35;">
            স্বাগতম, <span style="color: #E50914;">${name}</span>!
          </h1>
          <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। দেশের শীর্ষ টুর্নামেন্টগুলোতে অংশগ্রহণ করতে আপনি এখন সম্পূর্ণ প্রস্তুত।
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAFA; border: 1px solid #F1F5F9; border-radius: 12px; margin-bottom: 26px; text-align: left;">
            <tr><td style="padding: 13px 18px; border-bottom: 1px solid #EDEDED; font-size: 13.5px;">
              <span style="color: #6B7280;">ইমেইল:</span>
              <strong style="color: #111827; float: right; font-weight: 600;">${email}</strong>
            </td></tr>
            <tr><td style="padding: 13px 18px; font-size: 13.5px;">
              <span style="color: #6B7280;">সাপোর্ট পিন:</span>
              <strong style="color: #E50914; float: right; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; letter-spacing: 0.5px;">#${supportPin}</strong>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="text-align: left; font-size: 13.5px; color: #4B5563; line-height: 1.5;">
            <tr><td style="padding: 12px 0 12px 0; vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td><td style="padding-bottom: 12px;"><strong>স্লট বুক করুন:</strong> পছন্দের Solo বা Squad ম্যাচ বেছে নিন।</td></tr>
            <tr><td style="padding-bottom: 12px; vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td><td style="padding-bottom: 12px;"><strong>রুম অ্যাক্সেস:</strong> ম্যাচ শুরুর আগে অ্যাপেই পাবেন আইডি ও পাসওয়ার্ড।</td></tr>
            <tr><td style="vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td><td><strong>ইনস্ট্যান্ট ক্যাশআউট:</strong> সরাসরি বিকাশ ও নগদে প্রাইজমানি গ্রহণ করুন।</td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 20px 24px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px 0;">© 2026 ELITE ARENA BD. All rights reserved.</p>
          <p style="color: #9CA3AF; font-size: 11.5px; margin: 0;"><a href="https://elitearena.live" target="_blank" style="color: #6B7280; text-decoration: none;">elitearena.live</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ==========================================
// 🎨 ২. পাসওয়ার্ড রিসেট OTP টেমপ্লেট
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
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 40px 15px;"><tr><td align="center">
    <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden; text-align: center;">
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
        <table width="100%" style="background-color: #fff5f5; border: 1px solid #ffe3e3; border-radius: 12px; margin-bottom: 24px;">
          <tr><td align="center" style="padding: 20px; font-size: 32px; font-weight: 800; color: #e63946; letter-spacing: 8px; font-family: monospace;">
            ${otpCode}
          </td></tr>
        </table>
        <table width="100%" style="background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 12px; margin-bottom: 10px;">
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
  </td></tr></table>
</body>
</html>`;
}

// ==========================================
// 🎨 ৩. উইথড্র ও পেমেন্ট স্ট্যাটাস টেমপ্লেট
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF5F5; border-left: 4px solid #E50914; border-radius: 4px 10px 10px 4px; padding: 13px 15px; text-align: left; margin-bottom: 20px;">
      <tr>
        <td style="font-size: 13.5px; color: #991B1B; line-height: 1.5;">
          <strong>❌ বাতিলের কারণ:</strong> ${data.reason || 'এডমিন দ্বারা বাতিল করা হয়েছে'}
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
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #EAEAEA; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04); overflow: hidden; text-align: center;">
        <tr><td align="center" style="padding: 36px 30px 16px 30px;">
          <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="48" height="48" style="display: block; border-radius: 12px; margin-bottom: 12px;">
          <div style="font-size: 13px; font-weight: 800; color: #111827; letter-spacing: 2px; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif;">
            ELITE ARENA <span style="color: #E50914;">BD</span>
          </div>
        </td></tr>
        <tr><td style="padding: 0 32px 32px 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
            <tr><td style="${badgeStyle} border-radius: 50px; padding: 5px 16px;">
              <span style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Plus Jakarta Sans', sans-serif;">${badgeText}</span>
            </td></tr>
          </table>
          <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; line-height: 1.35;">${headline}</h1>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">${messageBody}</p>
          <table width="100%" style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 14px; padding: 16px; margin-bottom: 22px;">
            <tr><td align="center">
              <div style="font-size: 11.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">${amountLabel}</div>
              <div style="font-size: 32px; font-weight: 900; color: #111827; margin-top: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">৳${amount}</div>
            </td></tr>
          </table>
          <table width="100%" style="background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 14px; margin-bottom: 20px; text-align: left; overflow: hidden;">
            <tr><td style="padding: 12px 16px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #6B7280;">পেমেন্ট মেথড: <strong style="color: #111827; float: right; text-transform: capitalize;">${method}</strong></td></tr>
            <tr><td style="padding: 12px 16px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #6B7280;">প্রাপক ওয়ালেট নম্বর: <strong style="color: #111827; float: right; font-family: 'Plus Jakarta Sans', sans-serif;">${number}</strong></td></tr>
            <tr><td style="padding: 12px 16px; font-size: 13px; color: #6B7280;">অনুরোধের সময়: <strong style="color: #111827; float: right;">${date}</strong></td></tr>
          </table>
          ${reasonBoxHtml}
        </td></tr>
        <tr><td style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 18px 24px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 11.5px; margin: 0;">© 2026 ELITE ARENA BD • Transaction Notification</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ==========================================
// 🎨 ৪. শুক্রবারের স্পেশাল ডিপোজিট বোনাস অফার টেমপ্লেট
// ==========================================
function getFridayOfferEmailTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: 'Hind Siliguri', sans-serif;">
  <table width="100%" style="padding: 35px 12px;"><tr><td align="center">
    <table width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #CBD5E1; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06); overflow: hidden; text-align: center;">
      <tr><td align="center" style="padding: 30px 20px 14px 20px;">
        <img src="https://elitearena.live/favicon.png" alt="ELITE ARENA BD" width="48" height="48" style="display: block; border-radius: 12px; margin: 0 auto 10px auto;">
        <div style="color: #0F172A; font-size: 15px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">ELITE ARENA <span style="color: #E50914;">BD</span></div>
      </td></tr>
      <tr><td style="padding: 20px 24px 30px 24px;">
        <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; line-height: 1.4; margin: 0 0 8px 0;">🎉✨ পবিত্র শুক্রবার স্পেশাল<br><span style="color: #E50914;">ডিপোজিট বোনাস অফার</span> ✨🎉</h1>
        <p style="color: #1E293B; font-size: 14.5px; margin: 0 0 18px 0; font-weight: 600;">নির্ধারিত প্যাকেজে ডিপোজিট করে উপভোগ করুন আকর্ষণীয় ক্যাশ বোনাস!</p>
        <table width="100%" style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 16px; padding: 6px 10px; margin-bottom: 20px;">
          <tr><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-weight: 700;">💸 99 টাকা</td><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; color: #E50914; font-weight: 800;">🎁 110 টাকা (+11৳)</td></tr>
          <tr style="background-color: #F8FAFC;"><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-weight: 700;">💸 149 টাকা</td><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; color: #E50914; font-weight: 800;">🎁 165 টাকা (+16৳)</td></tr>
          <tr><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-weight: 700;">💸 249 টাকা</td><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; color: #E50914; font-weight: 800;">🎁 280 টাকা (+31৳)</td></tr>
          <tr style="background-color: #F8FAFC;"><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-weight: 700;">💸 349 টাকা</td><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; color: #E50914; font-weight: 800;">🎁 390 টাকা (+41৳)</td></tr>
          <tr><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-weight: 700;">💸 499 টাকা</td><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; color: #E50914; font-weight: 800;">🎁 560 টাকা (+61৳)</td></tr>
          <tr style="background-color: #F8FAFC;"><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: left; font-weight: 700;">💸 999 টাকা</td><td style="padding: 9px 10px; border-bottom: 1px dashed #CBD5E1; text-align: right; color: #E50914; font-weight: 800;">🎁 1120 টাকা (+121৳)</td></tr>
          <tr style="background-color: #FFF1F2;"><td style="padding: 11px 10px; text-align: left; font-weight: 900;">🔥 1999 টাকা</td><td style="padding: 11px 10px; text-align: right; color: #E50914; font-weight: 900;">🎁 2250 টাকা (+251৳)</td></tr>
        </table>
        <div style="background: #FFF9F9; border: 1px solid #FECDD3; border-left: 5px solid #E50914; border-radius: 8px; padding: 12px; font-size: 13.5px; text-align: left; font-weight: 600;">
          ⏰ অফারটি চলবে আজ সকাল ৯:০০ টা থেকে রাত ১২:০০ টা পর্যন্ত।
        </div>
      </td></tr>
      <tr><td style="padding: 16px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0;"><p style="font-size: 12.5px; margin: 0; color: #475569;">© 2026 ELITE ARENA BD • Official Offers</p></td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

// ==========================================
// 🎨 ৫. রিব্র্যান্ডিং / কামব্যাক মেইল টেমপ্লেট
// ==========================================
function getRebrandEmailTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>LONE WOLF BD এখন ELITE ARENA BD</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 30px 12px;"><tr><td align="center">
    <table width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; padding: 25px;">
      <div style="height: 4px; background-color: #ff003c; margin: -25px -25px 20px -25px;"></div>
      <h3 style="color: #0f172a; margin-bottom: 5px;">প্রিয় <span style="color: #ff003c;">${name}</span>,</h3>
      <p style="color: #64748b; font-size: 13.5px;">আপনার <strong>LONE WOLF BD</strong> অ্যাকাউন্ট সংক্রান্ত একটি জরুরী নোটিশ:</p>
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin: 15px 0; border: 1px solid #edf2f7; text-align: left; font-size: 13px;">
        <p style="margin: 6px 0; color: #334155;"><strong>১. নাম পরিবর্তন:</strong> সার্ভার আপগ্রেডের জন্য অ্যাপের নাম পরিবর্তন করে <strong>ELITE ARENA BD</strong> করা হয়েছে।</p>
        <p style="margin: 6px 0; color: #334155;"><strong>২. ব্যালেন্স ১০০% নিরাপদ:</strong> আগের জিমেইল দিয়ে লগইন করলেই আপনার সমস্ত ব্যালেন্স ও ডাটা অক্ষত পাবেন।</p>
        <p style="margin: 6px 0; color: #334155;"><strong>৩. নতুন APK:</strong> নিচের বাটনে ক্লিক করে নতুন ভার্সন ইনস্টল করুন।</p>
      </div>
      <a href="https://elitearena.live" target="_blank" style="display: block; background: #ff003c; color: #ffffff; text-decoration: none; padding: 13px 0; font-size: 15px; font-weight: bold; border-radius: 10px; text-align: center; margin-top: 15px;">নতুন অ্যাপ ডাউনলোড করুন</a>
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 15px;">© 2026 ELITE ARENA BD • All rights reserved.</p>
    </table>
  </td></tr></table>
</body></html>`;
}

// ==========================================
// 🎨 ৬. ইনঅ্যাক্টিভ প্লেয়ার রিমাইন্ডার টেমপ্লেট
// ==========================================
function getReminderEmailTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>ELITE ARENA BD</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 40px 15px;"><tr><td align="center">
    <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #edf2f7; padding: 30px; text-align: center;">
      <img src="https://elitearena.live/favicon.png" width="56" height="56" style="border-radius: 12px; margin-bottom: 12px;">
      <h2 style="color: #e63946; margin: 0 0 10px 0;">আপনাকে মিস করছে টুর্নামেন্ট, ${name}!</h2>
      <p style="color: #475569; line-height: 1.6; font-size: 14px;">গত কয়েকদিন ধরে আপনাকে অ্যাপে পাওয়া যাচ্ছে না। নিয়মিত ম্যাচ স্লট ওপেন রয়েছে। এখনই অ্যাপে প্রবেশ করে প্রাইজমানি জিতে নিন।</p>
      <a href="https://elitearena.live" target="_blank" style="display: inline-block; background-color: #e63946; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">অ্যাপে প্রবেশ করুন</a>
    </table>
  </td></tr></table>
</body></html>`;
}

// ==========================================
// 🔍 ১-ক্লিক টেস্ট রাউট (Queen SMTP Direct Diagnostic)
// ==========================================
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';
  const type = req.query.type || 'welcome'; // welcome, otp, withdraw, reject, offer, comeback, reminder

  try {
    let from = `ELITE ARENA Official <welcome@${DOMAIN}>`;
    let subject = 'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে';
    let plainText = 'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।';
    let html = getWelcomeEmailTemplate({ name: 'Alamin Arif', supportPin: '7842', email: targetEmail });

    if (type === 'otp') {
      from = `ELITE ARENA Security <security@${DOMAIN}>`;
      subject = 'পাসওয়ার্ড রিকভারি ওটিপি কোড (OTP)';
      plainText = 'আপনার পাসওয়ার্ড রিকভারি ওটিপি কোড: 489210';
      html = getOtpEmailTemplate('Alamin Arif', '489210');
    } else if (type === 'withdraw') {
      from = `ELITE ARENA Payment <payment@${DOMAIN}>`;
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
      from = `ELITE ARENA Payment <payment@${DOMAIN}>`;
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
      from = `ELITE ARENA Offers <offers@${DOMAIN}>`;
      subject = 'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস! - ELITE ARENA BD';
      plainText = 'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস অফার! আজই ডিপোজিট করুন।';
      html = getFridayOfferEmailTemplate('Alamin Arif');
    } else if (type === 'comeback') {
      from = `ELITE ARENA BD <noreply@${DOMAIN}>`;
      subject = 'জরুরী নোটিশ: LONE WOLF BD এখন ELITE ARENA BD!';
      plainText = 'জরুরী নোটিশ: LONE WOLF BD এর নাম পরিবর্তন করে ELITE ARENA BD করা হয়েছে।';
      html = getRebrandEmailTemplate('Alamin Arif');
    } else if (type === 'reminder') {
      from = `ELITE ARENA BD <noreply@${DOMAIN}>`;
      subject = 'আপনাকে মিস করছে টুর্নামেন্ট, Alamin Arif!';
      plainText = 'আপনাকে মিস করছে টুর্নামেন্ট! এখনই অ্যাপে ঢুকুন।';
      html = getReminderEmailTemplate('Alamin Arif');
    }

    const result = await sendQueenEmail({ from, to: targetEmail, subject, html, text: plainText });

    return res.json({
      success: true,
      fromUsed: from,
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
      from: `ELITE ARENA Security <security@${DOMAIN}>`,
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
// 💸 অ্যাডমিন উইথড্র নোটিফিকেশন API (Approve / Reject রসিদ)
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
      from: `ELITE ARENA Payment <payment@${DOMAIN}>`,
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
          from: `ELITE ARENA Official <welcome@${DOMAIN}>`,
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
// 🚀 ২. সবার জন্য অফার ব্রডকাস্ট API
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

    startCampaignBroadcast(
      queue, 
      `ELITE ARENA Offers <offers@${DOMAIN}>`,
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
// 🎯 ৩. পুরনো ও ড্রপ-আউট ইউজারদের কামব্যাক ব্রডকাস্ট API
// ==========================================
app.post('/api/broadcast-comeback', async (req, res) => {
  try {
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) {
      return res.status(400).json({ success: false, message: 'কোনো ইউজার পাওয়া যায়নি।' });
    }

    const users = usersSnap.val();
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const queue = [];

    for (const uid in users) {
      const u = users[uid];
      if (!u.email || !u.email.includes('@') || u.isBanned === true) continue;

      const lastActive = u.last_active;

      if (!lastActive || (now - lastActive) > THIRTY_DAYS_MS) {
        queue.push({ uid, email: u.email.trim(), name: u.name || 'Player' });
      }
    }

    if (queue.length === 0) {
      return res.json({ success: false, message: 'কোনো ড্রপ-আউট বা পুরনো ইউজার পাওয়া যায়নি। সবাই অ্যাক্টিভ আছে!' });
    }

    startCampaignBroadcast(
      queue, 
      `ELITE ARENA BD <noreply@${DOMAIN}>`,
      'Old User Comeback', 
      getRebrandEmailTemplate, 
      'জরুরী নোটিশ: LONE WOLF BD এখন ELITE ARENA BD!',
      'জরুরী নোটিশ: LONE WOLF BD এর নাম পরিবর্তন করে ELITE ARENA BD করা হয়েছে।'
    );

    return res.json({
      success: true,
      message: `কামব্যাক ব্রডকাস্ট শুরু হয়েছে (মোট ${queue.length} জন ড্রপ-আউট ইউজার)।`,
      totalOldUsers: queue.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ⚙️ ব্যাকগ্রাউন্ড ব্রডকাস্ট ইঞ্জিন (Queen SMTP)
// ==========================================
async function startCampaignBroadcast(queue, fromAddress, campaignName, templateFunc, subject, plainText) {
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
        from: fromAddress,
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
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Elite Arena Queen SMTP Email Service Running on Port ${PORT}`));
