const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🔗 আপনার ৭টি সম্পূর্ণ সক্রিয় Google Webhooks
// ==========================================
const ALL_7_WEBHOOKS = [
  { name: "security", email: "security.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbw19a3YdP6tregoB-IsHPrWXZhLRki93cWxKJ2x8WiRJ6TUNETh0y-5IJcOzc_AFamltg/exec" },
  { name: "welcome", email: "welcome.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbyvhaE9rtQQR1y3ato8za2aW-lHhdQvR5vzUTlPSkE5RPshT_0vjPj2e2gY-YlQBPM/exec" },
  { name: "offer", email: "offer.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbyDtu-QHB6ZjXOeitPGB9VMyZEuZinjqllA9Whq1DGlnJsrE1inBVGnLjYcysBviHxI/exec" },
  { name: "fridayoffer", email: "fridayoffer.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbxd8sjApooKE3Q3-Jcvy4pQh1GpJVTjGmtzSbm6B9p46WRwZycKn82FdDllH19dBucMDg/exec" },
  { name: "todayoffer", email: "todayoffer.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbw8i45zrFh9KF9sHAkAxGY6_H8Ea4HC0e0nD40EL26zNdyAYsetp7FmCdx0fyF5-bvt/exec" },
  { name: "youroffer", email: "youroffer.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbzQSNMW6lU0wJqK7gBvfHdzysoxKU1ZZau0sq-Sg73kz06DlssXgHT_8cWs4uNsxdpeNg/exec" },
  { name: "user", email: "user.elitearenabd@gmail.com", url: "https://script.google.com/macros/s/AKfycbz7rFGxRCu3avkRjpDsw3iKnjg38Yes7c1EafWdVXgCdgEsIdDxSEgpjo4brDVS2YvIfw/exec" }
];

// 🟢 হেলথ চেক রুট
app.get('/', (req, res) => {
  res.status(200).send("🚀 Elite Arena 7-Gmail Enterprise Email Microservice Live & Active!");
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
    console.log("✅ Firebase Connected to 7-Gmail Email Service");
  }
} catch (e) {
  console.error("Firebase Error:", e.message);
}

const db = admin.database();

// ==========================================
// ⚡ গুগল রিলে দিয়ে অ্যান্টি-স্প্যাম মেইল পাঠানোর মূল ফাংশন
// ==========================================
async function sendViaWebhook(webhookUrl, to, subject, htmlContent, plainText = "", senderName = "ELITE ARENA BD") {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      to: to.trim(),
      subject: subject,
      html: htmlContent,
      text: plainText || "ELITE ARENA BD - Official Notification",
      name: senderName
    })
  });
  return await response.json();
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
            <tr><td style="padding-bottom: 12px; vertical-align: top; width: 24px; color: #E50914; font-weight: bold;">✓</td><td style="padding-bottom: 12px;"><strong>স্লট বুক করুন:</strong> পছন্দের Solo বা Squad ম্যাচ বেছে নিন।</td></tr>
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
// 🎨 ২. শুক্রবারের স্পেশাল ডিপোজিট বোনাস অফার টেমপ্লেট
// ==========================================
function getFridayOfferEmailTemplate(userName) {
  const name = userName || 'Player';
  return `
<!DOCTYPE html>
<html lang="bn"><head><meta charset="UTF-8"><title>Friday Special Offer</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table width="100%" style="padding: 35px 12px;"><tr><td align="center">
    <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden;">
      <tr><td style="background: linear-gradient(90deg, #ff003c 0%, #ff3366 100%); height: 5px;"></td></tr>
      <tr><td align="center" style="padding: 32px 25px 12px 25px;">
        <img src="https://elitearena.live/favicon.png" width="60" height="60" style="border-radius: 14px; box-shadow: 0 6px 20px rgba(255,0,60,0.22);">
        <div style="margin-top: 12px; color: #0f172a; font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">ELITE ARENA BD</div>
      </td></tr>
      <tr><td style="padding: 10px 26px 30px 26px; text-align: center;">
        <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 50px; padding: 4px 16px; display: inline-block; margin-bottom: 12px;">
          <span style="color: #ff003c; font-size: 11.5px; font-weight: 800;">✨ পবিত্র শুক্রবারের ধামাকা অফার ✨</span>
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 8px 0;">স্পেশাল ডিপোজিট বোনাস,<br><span style="color: #ff003c;">${name}</span></h1>
        <p style="color: #475569; font-size: 13.5px; line-height: 1.5; margin: 0 0 20px 0;">🤲 শুধুমাত্র আজকের জন্য থাকছে আকর্ষণীয় Bonus Offer! নিচে দেওয়া যেকোনো অ্যামাউন্ট ডিপোজিট করলেই বোনাস যোগ হবে:</p>
        <table width="100%" style="background-color: #f8fafc; border: 1.5px solid #edf2f7; border-radius: 16px; margin-bottom: 20px; font-size: 13.5px; text-align: left;">
          <tr style="background: #0f172a; color: #fff;"><td style="padding: 10px 14px; font-weight: 700;">ডিপোজিট</td><td style="padding: 10px 14px; font-weight: 700; text-align: right;">টোটাল ব্যালেন্স পাবেন</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳99</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳110</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳149</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳165</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳249</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳280</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳349</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳390</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳499</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳560</td></tr>
          <tr><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7;">💸 ৳999</td><td style="padding: 8px 14px; border-bottom: 1px solid #edf2f7; text-align: right; color: #ff003c; font-weight: 800;">🎁 ৳1,120</td></tr>
          <tr style="background: #fff5f5;"><td style="padding: 10px 14px;">🔥 ৳1,999</td><td style="padding: 10px 14px; text-align: right; color: #ff003c; font-weight: 900;">🎁 ৳2,250</td></tr>
        </table>
        <div style="background: #fff9f9; border: 1px dashed #ffccd5; border-radius: 10px; padding: 10px; color: #b91c1c; font-size: 12.5px; font-weight: 700; margin-bottom: 20px;">
          ⏰ অফারটি শুধুমাত্র আজ (পবিত্র শুক্রবার) রাত ১১:৫৯ মিনিট পর্যন্ত সক্রিয়।
        </div>
        <a href="https://elitearena.live" target="_blank" style="display: block; width: 100%; max-width: 280px; margin: 0 auto; background: #ff003c; color: #ffffff; text-decoration: none; padding: 13px 0; font-size: 15px; font-weight: 800; border-radius: 10px;">💸 এখনই ডিপোজিট করুন</a>
      </td></tr>
      <tr><td style="padding: 16px 20px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">© 2026 ELITE ARENA BD • Official Offers</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

// ==========================================
// 🎨 ৩. রিব্র্যান্ডিং / কামব্যাক মেইল টেমপ্লেট
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
// 🔍 ১. নির্দিষ্ট যেকোনো ১টি অ্যাকাউন্ট টেস্ট করার রুট
// ==========================================
app.get('/api/test-email', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';
  const accountName = (req.query.account || 'welcome').toLowerCase(); // security, welcome, offer, fridayoffer, todayoffer, youroffer, user

  const targetAccount = ALL_7_WEBHOOKS.find(acc => acc.name === accountName) || ALL_7_WEBHOOKS[1];

  try {
    let subject = `স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে (${targetAccount.name})`;
    let plainText = `স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। (${targetAccount.email})`;
    let htmlContent = getWelcomeEmailTemplate({
      name: 'Alamin Arif',
      supportPin: '7842',
      email: targetEmail
    });

    if (accountName.includes('offer')) {
      subject = `পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস! - ELITE ARENA BD (${targetAccount.name})`;
      plainText = 'পবিত্র শুক্রবার স্পেশাল ডিপোজিট বোনাস অফার! আজই ডিপোজিট করুন।';
      htmlContent = getFridayOfferEmailTemplate('Alamin Arif');
    } else if (accountName === 'user') {
      subject = `জরুরী নোটিশ: LONE WOLF BD এখন ELITE ARENA BD! (${targetAccount.name})`;
      plainText = 'জরুরী নোটিশ: LONE WOLF BD এর নাম পরিবর্তন করে ELITE ARENA BD করা হয়েছে।';
      htmlContent = getRebrandEmailTemplate('Alamin Arif');
    }

    const result = await sendViaWebhook(targetAccount.url, targetEmail, subject, htmlContent, plainText, `ELITE ARENA BD - ${targetAccount.name}`);

    return res.json({ 
      success: true, 
      accountUsed: targetAccount.name,
      senderEmail: targetAccount.email,
      message: `টেস্ট মেইল সফলভাবে পাঠানো হয়েছে ${targetAccount.email} থেকে!`,
      googleResponse: result 
    });
  } catch (err) {
    return res.status(500).json({ success: false, account: targetAccount.name, error: err.message });
  }
});

// ==========================================
// ⚡ ২. এক ক্লিকে সব ৭টি অ্যাকাউন্ট একসাথে টেস্ট করার মাস্টার রুট
// ==========================================
app.get('/api/test-all-accounts', async (req, res) => {
  const targetEmail = req.query.email || 'alaminarif770@gmail.com';
  const results = [];

  for (let i = 0; i < ALL_7_WEBHOOKS.length; i++) {
    const acc = ALL_7_WEBHOOKS[i];
    try {
      const resGoogle = await sendViaWebhook(
        acc.url,
        targetEmail,
        `[TEST] ${acc.name} জিমেইল থেকে টেস্ট ইমেইল (${acc.email})`,
        `<div style="font-family:sans-serif;padding:25px;text-align:center;border:1px solid #e2e8f0;border-radius:12px;"><h2 style="color:#10b981;">✅ ${acc.name} একাউন্ট ১০০% সফলভাবে কাজ করছে!</h2><p style="color:#475569;">প্রেরক জিমেইল: <b>${acc.email}</b></p></div>`,
        `${acc.name} একাউন্ট (${acc.email}) সফলভাবে কাজ করছে!`,
        `ELITE ARENA - ${acc.name}`
      );
      results.push({ account: acc.name, email: acc.email, status: "success", response: resGoogle });
    } catch (err) {
      results.push({ account: acc.name, email: acc.email, status: "failed", error: err.message });
    }
    await new Promise(r => setTimeout(r, 400));
  }

  return res.json({
    success: true,
    message: `সকল ৭টি জিমেইল অ্যাকাউন্টের টেস্ট সফলভাবে সম্পন্ন হয়েছে! আপনার ইনবক্স চেক করুন।`,
    testedAccounts: results
  });
});

// ==========================================
// 🤖 ৩. স্বয়ংক্রিয় রিয়েলটাইম ওয়েলকাম ইমেইল লিসেনার
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

      if ((now - joinedTime) < 2 * 60 * 60 * 1000) {
        const welcomeWebhook = ALL_7_WEBHOOKS.find(w => w.name === "welcome") || ALL_7_WEBHOOKS[1];
        await sendViaWebhook(
          welcomeWebhook.url,
          user.email,
          'স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে',
          getWelcomeEmailTemplate({
            name: user.name || 'Player',
            supportPin: user.supportPin || 'N/A',
            email: user.email
          }),
          `স্বাগতম! ELITE ARENA BD-তে আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে। আপনার সাপোর্ট পিন: #${user.supportPin || 'N/A'}`,
          "ELITE ARENA BD - Official"
        );

        await db.ref(`welcome_email_logs/${uid}`).set({ sentAt: now });
        console.log(`✅ [Auto-Welcome] Sent to new user: ${user.email}`);
      }
    }
  } catch (err) {
    console.error("Auto Welcome Listener Error:", err.message);
  }
});

// ==========================================
// 🚀 ৪. সবার জন্য অফার ব্রডকাস্ট API
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
// 🎯 ৫. পুরনো ও ড্রপ-আউট ইউজারদের কামব্যাক ব্রডকাস্ট API (স্মার্ট ফিল্টার্ড)
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
// ⚙️ ব্যাকগ্রাউন্ড মাল্টি-জিমেইল রোটেশন ইঞ্জিন (৭টি জিমেইলে ৩,৫০০ ডিস্ট্রিবিউশন)
// ==========================================
async function startCampaignBroadcast(queue, campaignName, templateFunc, subject, plainText) {
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
    const selectedAccount = ALL_7_WEBHOOKS[i % ALL_7_WEBHOOKS.length];
    let isSuccess = false;
    let failReason = null;

    try {
      await sendViaWebhook(
        selectedAccount.url, 
        item.email, 
        subject, 
        templateFunc(item.name), 
        plainText, 
        "ELITE ARENA BD"
      );
      isSuccess = true;
      successCount++;
    } catch (err) {
      isSuccess = false;
      failReason = err.message || 'Webhook Relay Error';
      failCount++;
    }

    const processed = i + 1;
    const percentage = Math.round((processed / total) * 100);
    const logTime = new Date().toLocaleTimeString('en-US', { hour12: true });

    await logsRef.push({
      message: isSuccess 
        ? `✅ [${logTime}] (${processed}/${total}) Sent via ${selectedAccount.name}: ${item.email}` 
        : `❌ [${logTime}] (${processed}/${total}) Failed via ${selectedAccount.name}: ${item.email} (${failReason})`,
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

    await new Promise(res => setTimeout(res, 350));
  }

  await statusRef.update({ isRunning: false, statusText: 'Completed', endTime: Date.now() });
}

// 🟢 ক্লাউড হোস্ট বাইন্ডিং
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Elite Arena 7-Gmail Enterprise Service Running on Port ${PORT}`));
